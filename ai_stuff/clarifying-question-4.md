**Clarifying Question 4: History Fetching Mechanism**

You mentioned that when a user arrives in a room, they can request the room's history to download older messages and have the full conversation. Let me clarify how you envision this working:

**History Storage:**
- Where should the chat history be stored? (Considering your preference to not save data permanently)
- Should history have a time limit (e.g., last 24 hours) or message limit (e.g., last 100 messages)?
- How should history be associated with a room? (By room ID from URL)

**History Retrieval:**
- When should a user be able to request history? (Automatically upon joining, or on-demand via a button?)
- Should the history be loaded all at once, or paginated as the user scrolls up?
- What format should the history data be in when fetched?

**History and Real-time Updates:**
- How does the history fetching mechanism interact with real-time message updates?
- If a user is viewing history and new messages arrive, how should the interface handle this?
- Should requesting history clear the current message view or append to it?

**Edge Cases:**
- What happens if a user joins a room that has never been used before? (Empty history)
- What happens if the requested history exceeds storage limits?

Please provide your preferences for how the history fetching mechanism should work in chat-anywhere.