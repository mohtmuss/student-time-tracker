import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function ChatBot({ students, onToggleTheme }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I can help you find information about your students. You can also ask me to **toggle the theme**, **clock in/out** students, or **add** new ones!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;
    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

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

      // Handle toggle theme action
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
    }
  }

  return (
    <div className="chatbot">
      <h1 style={{ color: 'var(--text-primary)' }}>Student Assistant</h1>

      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.role}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {msg.content}
            </ReactMarkdown>
          </div>
        ))}
        {loading && (
          <div className="chat-message assistant">
            <p>Thinking...</p>
          </div>
        )}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Ask about your students..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default ChatBot;