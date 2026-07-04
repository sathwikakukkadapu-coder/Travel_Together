import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import chatService from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getInitials, getErrorMessage } from '../../utils/helpers';

const AvatarCircle = ({ name = '', avatar = '', size = 40, online = false }) => (
  <div className="position-relative flex-shrink-0">
    {avatar
      ? <img src={avatar} alt={name} className="rounded-circle object-fit-cover" width={size} height={size} />
      : <div
          className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center fw-bold text-primary"
          style={{ width: size, height: size, fontSize: size * 0.35 }}
        >
          {getInitials(name)}
        </div>}
    {online && (
      <span
        className="position-absolute bg-success rounded-circle border border-white"
        style={{ width: 10, height: 10, bottom: 1, right: 1 }}
      />
    )}
  </div>
);

const Chat = () => {
  const { userId: urlUserId } = useParams();
  const { user: currentUser } = useAuth();
  const { on, off, onlineUsers, joinConversation, leaveConversation, sendTypingStart, sendTypingStop, markMessagesRead } = useSocket();
  const navigate = useNavigate();

  const [conversations, setConversations]   = useState([]);
  const [messages, setMessages]             = useState([]);
  const [selectedUser, setSelectedUser]     = useState(null);
  const [messageText, setMessageText]       = useState('');
  const [searchQuery, setSearchQuery]       = useState('');
  const [typingUsers, setTypingUsers]       = useState({});

  const [loadingConvs, setLoadingConvs]       = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending]                 = useState(false);
  const [error, setError]                     = useState('');

  const messagesEndRef  = useRef(null);
  const messageInputRef = useRef(null);
  const typingTimer     = useRef(null);

  // ── Fetch conversations ───────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    setLoadingConvs(true);
    try {
      const res = await chatService.getConversations();
      // API returns { success, count, data: [ { conversationId, participant, lastMessage, unreadCount } ] }
      const convs = (res.data?.data ?? []).map((c) => ({
        ...c,
        // Normalise: the API uses `participant`, frontend used `otherUser`
        otherUser: c.participant ?? c.otherUser,
      }));
      setConversations(convs);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // ── Auto-select when URL has userId ──────────────────────────────────
  useEffect(() => {
    if (urlUserId) openConversation(urlUserId);
   },[ urlUserId]);

  // ── Real-time: incoming messages ──────────────────────────────────────
  useEffect(() => {
    const handler = (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      // Mark read immediately if we're in this conversation
      if (selectedUser && (msg.sender?._id === selectedUser._id || msg.sender === selectedUser._id)) {
        markMessagesRead(selectedUser._id);
      }
      fetchConversations();
    };
    const cleanup = on('message:new', handler);
    return () => { typeof cleanup === 'function' ? cleanup() : off('message:new', handler); };
  }, [on, off, selectedUser, markMessagesRead, fetchConversations]);

  // ── Real-time: typing indicators ──────────────────────────────────────
  useEffect(() => {
    const startHandler = ({ userId }) => setTypingUsers((p) => ({ ...p, [userId]: true }));
    const stopHandler  = ({ userId }) => setTypingUsers((p) => { const n = { ...p }; delete n[userId]; return n; });
    const c1 = on('typing:start', startHandler);
    const c2 = on('typing:stop',  stopHandler);
    return () => {
      typeof c1 === 'function' ? c1() : off('typing:start', startHandler);
      typeof c2 === 'function' ? c2() : off('typing:stop',  stopHandler);
    };
  }, [on, off]);

  // ── Scroll to bottom on new messages ──────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = async (userId) => {
    if (!userId) return;
    // Leave previous room
    if (selectedUser) leaveConversation(selectedUser._id);

    setLoadingMessages(true);
    setError('');
    try {
      const conv = conversations.find((c) => c.otherUser?._id === userId);
      setSelectedUser(conv?.otherUser || { _id: userId, name: 'User' });

      const res = await chatService.getMessages(userId);
      // API: { success, count, data: [...messages], participant }
      setMessages(res.data?.data ?? []);

      // Join socket room + mark read
      joinConversation(userId);
      markMessagesRead(userId);
      await chatService.markConversationRead(userId);
      fetchConversations();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedUser) return;

    setSending(true);
    // Stop typing indicator
    sendTypingStop(selectedUser._id);
    clearTimeout(typingTimer.current);

    try {
      const res = await chatService.sendMessage(selectedUser._id, { content: messageText.trim() });
      // API: { success, data: <message> }
      const newMsg = res.data?.data ?? res.data;
      setMessages((prev) => [...prev, newMsg]);
      setMessageText('');
      fetchConversations();
      messageInputRef.current?.focus();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setMessageText(e.target.value);
    if (!selectedUser) return;
    sendTypingStart(selectedUser._id);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => sendTypingStop(selectedUser._id), 1500);
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    const date = new Date(iso);
    const now  = new Date();
    const diff = now - date;
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return 'Just now';
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7)   return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isTyping = selectedUser && typingUsers[selectedUser._id];

  return (
    <div className="container-fluid p-0">
      <div className="row g-0" style={{ height: 'calc(100vh - var(--tt-navbar-height) - 3rem)' }}>

        {/* ── Left Panel: Conversation List ── */}
        <div className="col-lg-4 border-end d-flex flex-column" style={{ maxHeight: '100%' }}>
          <div className="p-3 border-bottom bg-white">
            <h5 className="mb-2 fw-bold">Messages</h5>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-transparent"><i className="bi bi-search" /></span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-grow-1 overflow-auto">
            {loadingConvs && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" />
              </div>
            )}

            {!loadingConvs && conversations.length === 0 && (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-chat-dots fs-1 opacity-25 d-block mb-3" />
                <p className="small mb-0">No conversations yet.</p>
                <p className="small">Find a buddy and start chatting!</p>
              </div>
            )}

            {!loadingConvs && filteredConversations.map((conv) => {
              const isSelected = selectedUser?._id === conv.otherUser?._id;
              const isOnline   = onlineUsers[conv.otherUser?._id];
              return (
                <div
                  key={conv.conversationId}
                  className={`d-flex align-items-center gap-3 p-3 border-bottom conversation-item ${isSelected ? 'bg-primary bg-opacity-10' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    navigate(`/chat/${conv.otherUser?._id}`);
                    openConversation(conv.otherUser?._id);
                  }}
                >
                  <AvatarCircle name={conv.otherUser?.name} avatar={conv.otherUser?.avatar} online={isOnline} />
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex justify-content-between align-items-start">
                      <p className="fw-semibold mb-0 text-truncate small">{conv.otherUser?.name}</p>
                      {conv.lastMessage?.createdAt && (
                        <span className="text-muted" style={{ fontSize: '.7rem', whiteSpace: 'nowrap' }}>
                          {formatTime(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className="text-muted mb-0 text-truncate" style={{ fontSize: '.8rem' }}>
                        {conv.lastMessage.sender?.toString() === currentUser?._id?.toString() ? 'You: ' : ''}
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="badge bg-danger rounded-pill">{conv.unreadCount}</span>
                  )}
                </div>
              );
            })}

            {!loadingConvs && searchQuery && filteredConversations.length === 0 && (
              <div className="text-center py-4 text-muted small">
                No conversations match your search.
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel: Chat Window ── */}
        <div className="col-lg-8 d-flex flex-column" style={{ maxHeight: '100%' }}>
          {!selectedUser ? (
            <div className="d-flex align-items-center justify-content-center h-100 text-muted">
              <div className="text-center">
                <i className="bi bi-chat-square-text fs-1 opacity-25 d-block mb-3" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-3 border-bottom bg-white d-flex align-items-center gap-3">
                <AvatarCircle
                  name={selectedUser.name}
                  avatar={selectedUser.avatar}
                  size={44}
                  online={onlineUsers[selectedUser._id]}
                />
                <div className="flex-grow-1">
                  <h6 className="mb-0 fw-semibold">{selectedUser.name}</h6>
                  <small className="text-muted">
                    {onlineUsers[selectedUser._id] ? (
                      <span className="text-success"><i className="bi bi-circle-fill me-1" style={{ fontSize: '.55rem' }} />Online</span>
                    ) : 'Offline'}
                  </small>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-grow-1 overflow-auto p-3 bg-light">
                {loadingMessages && (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" />
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger alert-dismissible">
                    <i className="bi bi-exclamation-triangle-fill me-2" />{error}
                    <button className="btn-close" onClick={() => setError('')} />
                  </div>
                )}

                {!loadingMessages && messages.length === 0 && (
                  <div className="text-center py-5 text-muted">
                    <i className="bi bi-chat fs-1 opacity-25 d-block mb-3" />
                    <p className="small">No messages yet. Start the conversation!</p>
                  </div>
                )}

                {!loadingMessages && messages.map((msg, idx) => {
                  const isSent = msg.sender?._id === currentUser?._id || msg.sender === currentUser?._id;
                  return (
                    <div key={msg._id || idx} className={`d-flex mb-3 ${isSent ? 'justify-content-end' : 'justify-content-start'}`}>
                      {!isSent && (
                        <AvatarCircle name={selectedUser.name} avatar={selectedUser.avatar} size={28} />
                      )}
                      <div className={`${isSent ? 'tt-bubble-sent ms-2' : 'tt-bubble-recv ms-2'}`}>
                        <div>{msg.content}</div>
                        <div className={`small mt-1 ${isSent ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '.68rem' }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isSent && msg.isRead && <i className="bi bi-check2-all ms-1" />}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <AvatarCircle name={selectedUser.name} avatar={selectedUser.avatar} size={28} />
                    <div className="tt-bubble-recv px-3 py-2">
                      <span className="text-muted small fst-italic">typing…</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-top bg-white">
                <form onSubmit={handleSendMessage} className="d-flex gap-2">
                  <input
                    ref={messageInputRef}
                    type="text"
                    className="form-control"
                    placeholder="Type a message..."
                    value={messageText}
                    onChange={handleTyping}
                    disabled={sending}
                    maxLength={1000}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary px-4"
                    disabled={!messageText.trim() || sending}
                  >
                    {sending
                      ? <span className="spinner-border spinner-border-sm" />
                      : <i className="bi bi-send-fill" />}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
