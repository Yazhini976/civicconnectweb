export async function sendChatMessage(message: string): Promise<string> {
  const chatbotUrl = import.meta.env.VITE_CHATBOT_URL || 'http://127.0.0.1:5000';
  const response = await fetch(`${chatbotUrl}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error("UGSS AI server not responding");
  }

  const data = await response.json();
  return data.reply;
}
