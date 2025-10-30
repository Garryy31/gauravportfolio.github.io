/* Portfolio behavior + Chatbot
   - The chatbot ships with a simple local fallback responder.
   - Optionally you can enable OpenAI by setting OPENAI_API_KEY below (do NOT commit your key).
*/

const contactStatus = document.getElementById('contactStatus');

function handleContact(e){
  e.preventDefault();
  // Basic UX-only handler. You can connect this to Email API / Formspree / Netlify form later.
  const name = document.getElementById('cname').value.trim();
  const email = document.getElementById('cemail').value.trim();
  const msg = document.getElementById('cmsg').value.trim();
  contactStatus.textContent = `Thanks ${name}! Message received — I'll reply at ${email} when possible.`;
  e.target.reset();
  setTimeout(()=> contactStatus.textContent = '', 8000);
}

/* ---------- Chatbot ---------- */
const chatBtn = document.getElementById('chatbot');
const chatOpenBtn = document.getElementById('chatOpenBtn');
const chatLog = document.getElementById('chatLog');
const chatForm = document.getElementById('chatForm');
const userPrompt = document.getElementById('userPrompt');

const OPENAI_API_KEY = "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"; // <-- OPTIONAL: add your OpenAI API key here to enable LLM responses (DO NOT commit the key)

function toggleChat(){
  const el = document.getElementById('chatbot');
  const open = el.classList.toggle('closed');
  if(open) {
    el.classList.remove('closed');
    el.setAttribute('aria-hidden','false');
  } else {
    el.classList.add('closed');
    el.setAttribute('aria-hidden','true');
  }
}
window.toggleChat = toggleChat;
window.openChat = ()=> {
  const el = document.getElementById('chatbot');
  el.classList.remove('closed');
  el.setAttribute('aria-hidden','false');
  document.getElementById('userPrompt').focus();
};

// local fallback responder (simple intent rules)
function localResponder(text){
  const t = text.toLowerCase();
  if(t.includes('projects')||t.includes('work')||t.includes('portfolio')) {
    return `I have built AI-powered dataset analysis tools, visualization dashboards, and a gesture recognition whiteboard. See the Projects section for details.`;
  }
  if(t.includes('skills')||t.includes('tech')||t.includes('languages')) {
    return `Technical skills: Java, Python, C++, JavaScript, React, Spring Boot, MySQL. Also GenAI: prompt design, LangChain, and LLM integrations.`; 
  }
  if(t.includes('resume')||t.includes('cv')) {
    return `You can download my resume from the footer or open the "Resume (PDF)" link.`;
  }
  if(t.includes('contact')||t.includes('hire')||t.includes('collaborate')) {
    return `You can email me at sonawanegaurav639@gmail.com or use the contact form on the site.`;
  }
  // small talk
  if(t.includes('hello')||t.includes('hi')) return `Hello! How can I help you today? Ask me about my projects or skills.`;
  if(t.includes('thanks')||t.includes('thank')) return `You're welcome — happy to help!`;

  return null;
}

function appendMessage(text, who='bot'){
  const m = document.createElement('div');
  m.className = `msg ${who==='user'?'user':'bot'}`;
  m.innerText = text;
  chatLog.appendChild(m);
  chatLog.scrollTop = chatLog.scrollHeight;
}

async function askOpenAI(prompt){
  // Minimal chat with OpenAI v1/chat/completions (you must provide your own key)
  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // replace to preferred model; subject to your account
        messages: [{role:'user',content:prompt}],
        max_tokens:400
      })
    });
    if(!resp.ok){
      console.warn('OpenAI error',resp.status);
      return null;
    }
    const data = await resp.json();
    const reply = data?.choices?.[0]?.message?.content;
    return reply ?? null;
  } catch(err){
    console.error(err);
    return null;
  }
}

async function sendMessage(e){
  e.preventDefault();
  const text = userPrompt.value.trim();
  if(!text) return;
  appendMessage(text,'user');
  userPrompt.value = '';
  // try local responder first
  const local = localResponder(text);
  if(local){
    appendMessage(local,'bot');
    return;
  }
  // if user configured OPENAI_API_KEY, use it
  if(OPENAI_API_KEY && OPENAI_API_KEY.length>10){
    appendMessage('Thinking...', 'bot');
    const response = await askOpenAI(text);
    // replace the placeholder thinking message
    if(response){
      // remove last 'Thinking...' message
      const last = chatLog.querySelector('.bot:last-child');
      if(last && last.innerText === 'Thinking...') last.remove();
      appendMessage(response,'bot');
      return;
    } else {
      // fallback
      const last = chatLog.querySelector('.bot:last-child');
      if(last && last.innerText === 'Thinking...') last.remove();
      appendMessage("I couldn't reach the AI service. Try again later or enable an API key in the script.",'bot');
      return;
    }
  }
  // If no OpenAI key, give a polite fallback
  appendMessage("I don't have an AI key configured — I'm using an offline helper. Try asking about projects, skills, or contact.",'bot');
}

window.sendMessage = sendMessage;
