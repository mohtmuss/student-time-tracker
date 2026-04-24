import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function MomoAvatar({ bounce = false, size = 36 }) {
  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #5865F2, #c9a227)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size === 36 ? '18px' : '32px',
      flexShrink: 0,
      boxShadow: '0 2px 8px rgba(88,101,242,0.4)',
      animation: bounce ? 'momoBounce 2s ease-in-out infinite' : 'none',
    }}>
      🤖
    </div>
  );
}

function TeacherAvatar({ name }) {
  const initial = name ? name[0].toUpperCase() : '?';
  return (
    <div style={{
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #c9a227, #f0c040)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '15px',
      fontWeight: '700',
      color: 'black',
      flexShrink: 0,
      boxShadow: '0 2px 8px rgba(201,162,39,0.4)'
    }}>
      {initial}
    </div>
  );
}

function ChatBot({ students, onToggleTheme, teacherEmail }) {
  const teacherName = teacherEmail
    ? teacherEmail.split('.')[0]
    : 'there';

  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hi ${teacherName}! I'm MoMo 🤖 — your student assistant. Ask me anything about your students, or ask me to clock in/out, add students, or toggle the theme!` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isIdle, setIsIdle] = useState(true);
  const messagesEndRef = useRef(null);
  const idleTimerRef = useRef(null);

  // Auto scroll to bottom on every new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Idle detection — bounce after 3 seconds of no activity
  function resetIdleTimer() {
    setIsIdle(false);
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setIsIdle(true), 3000);
  }

  useEffect(() => {
    // Start idle timer on mount
    idleTimerRef.current = setTimeout(() => setIsIdle(true), 3000);
    return () => clearTimeout(idleTimerRef.current);
  }, []);

  async function sendMessage() {
    if (!input.trim()) return;
    resetIdleTimer();
    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setIsIdle(false);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          students: JSON.stringify(students)
        })
      });
      const data = await response.json();
      if (data.action === 'TOGGLE_THEME') {
        onToggleTheme();
      }
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: data.response || "I'm sorry, I can only help with student time tracking information!"
      }]);
    } catch (error) {
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: "I'm sorry, something went wrong. Please try again!"
      }]);
    } finally {
      setLoading(false);
      // Resume idle after response
      idleTimerRef.current = setTimeout(() => setIsIdle(true), 3000);
    }
  }

  return (
    <>
      {/* Bounce keyframe animation */}
      <style>{`
        @keyframes momoBounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>

      <div className="chatbot">

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px'
        }}>
          <MomoAvatar bounce={isIdle} size={44} />
          <div>
            <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '22px' }}>MoMo</h1>
            <p style={{ margin: 0, fontSize: '12px', color: isIdle ? '#2ecc71' : 'var(--text-muted)' }}>
              {loading ? '⌛ Thinking...' : isIdle ? '🟢 Online · Waiting for you' : '💬 Active'}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages" onClick={resetIdleTimer}>
          {messages.map((msg, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '10px',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              marginBottom: '12px'
            }}>
              {msg.role === 'assistant'
                ? <MomoAvatar bounce={false} />
                : <TeacherAvatar name={teacherName} />
              }
              <div style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: msg.role === 'user'
                  ? '18px 18px 4px 18px'
                  : '18px 18px 18px 4px',
                backgroundColor: msg.role === 'user'
                  ? '#c9a227'
                  : 'var(--bg-secondary)',
                color: msg.role === 'user'
                  ? 'black'
                  : 'var(--text-primary)',
                border: msg.role === 'user'
                  ? 'none'
                  : '1px solid var(--border-color)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}

          {/* Thinking */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', marginBottom: '12px' }}>
              <MomoAvatar bounce={false} />
              <div style={{
                padding: '12px 16px',
                borderRadius: '18px 18px 18px 4px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                fontSize: '14px'
              }}>
                🤖 MoMo is thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chat-input" onClick={resetIdleTimer}>
          <input
            type="text"
            placeholder="Ask MoMo about your students..."
            value={input}
            onChange={(e) => { setInput(e.target.value); resetIdleTimer(); }}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </>
  );
}

export default ChatBot;