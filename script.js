document.addEventListener('DOMContentLoaded', () => {
  // UI element references
  const messagesContainer = document.getElementById('messagesContainer');
  const messageInput = document.getElementById('messageInput');
  const messageForm = document.getElementById('messageForm');
  const sendBtn = document.getElementById('sendBtn');
  const sidebarItems = document.querySelectorAll('.sidebar-item');
  const clearBtn = document.getElementById('clearHistoryBtn');
  const statusText = document.getElementById('statusText');

  let currentMode = 'chat';
  let conversation = [];

  // Sidebar mode switching
  sidebarItems.forEach(item => {
    item.addEventListener('click', () => {
      sidebarItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      currentMode = item.getAttribute('data-mode');
      showStatus(`Mode: ${currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}`);
      if (currentMode === 'chat') {
        addMessage("💬 Chat mode activated. Ask me anything!", "nora");
      }
      // You can add more per-mode behavior here.
    });
  });

  // Message rendering helper
  function addMessage(text, sender = "user") {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message ' + (sender === 'user' ? 'user-message' : 'jarvis-message');
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = text.replace(/\n/g, "<br>");
    msgDiv.appendChild(contentDiv);
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function showStatus(msg) {
    statusText.textContent = msg;
  }

  // Send chat to backend
  async function handleMessageSend(userText) {
    addMessage(userText, 'user');
    showStatus('Thinking...');
    sendBtn.disabled = true;
    messageInput.value = '';
    try {
      const res = await fetch('/api/chat', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText })
      });
      const data = await res.json();
      addMessage((data.response || "No reply."), "nora");
      showStatus(data.provider ? `Response from ${data.provider}` : "Ready");
    } catch (error) {
      addMessage("❌ Error: " + error.message, "nora");
      showStatus("Error");
    }
    sendBtn.disabled = false;
  }

  // Chat form handler
  messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = messageInput.value.trim();
    if (!val) return;
    handleMessageSend(val);
  });

  // "Clear Chat" button handler
  clearBtn.addEventListener('click', () => {
    if (!confirm("Clear chat history?")) return;
    messagesContainer.innerHTML = "";
    conversation = [];
    showStatus("Chat cleared.");
  });

  // Optional: Resize textarea for input
  messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
  });

  // Ready!
  showStatus("Ready");
});
