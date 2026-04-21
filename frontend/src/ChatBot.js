import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function ChatBot({ students }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I can help you find information about your students. Ask me anything!' }
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
      const assistantMessage = {
        role: 'assistant',
        content: data.response || "I'm sorry, I can only help with student time tracking information!"
      };
      setMessages([...updatedMessages, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: "I'm sorry, something went wrong. Please try again!"
      };
      setMessages([...updatedMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chatbot">
      <h1>Student Assistant</h1>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.role}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {msg.content}
            </ReactMarkdown>
          </div>
        ))}
        {loading && <div className="chat-message assistant"><p>Thinking...</p></div>}
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