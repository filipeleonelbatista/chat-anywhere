**Clarifying Question 2: Specific Features Implementation**

You mentioned wanting features like:
1. Envio de imagens (sending images)
2. Links com visualização do meta tags (links with meta tag preview)

Let me clarify how you'd like these implemented:

**For image sending:**
- Should users be able to upload images directly in the chat interface?
- Would you like a preview of the image before sending?
- Are there any specific image formats or size limits you'd like to enforce?
- How should images be stored/temporarily hosted? (Consider Vercel's limitations on file storage)

**For link previews:**
- When a user pastes a URL in the chat, should the app automatically fetch and display a preview with:
  - Title
  - Description
  - Thumbnail image
- Should this happen client-side or via an API route to avoid CORS issues?
- Would you like the preview to appear as the user types the URL or only after sending the message?

Please provide your preferences for these features so I can incorporate them into the design.