export const getSuccessLoginPage = (botId: string): string => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Salesforce Connection Successful</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');
      body {
        font-family: 'Inter', sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background-color: #1e1e2f;
        color: #f5f5f5;
        margin: 0;
      }
      .container {
        background: #2c2c3e;
        padding: 30px 50px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        text-align: center;
        max-width: 400px;
        margin: 0 20px;
      }
      .container h1 {
        font-size: 28px;
        color: #ffffff;
        margin-bottom: 20px;
        font-weight: 600;
      }
      .container p {
        font-size: 16px;
        color: #d1d1d1;
        margin-bottom: 20px;
      }
      .container svg {
        max-width: 100px;
      }
      .container a {
        display: inline-block;
        padding: 10px 20px;
        font-size: 16px;
        color: #ffffff;
        background-color: #007bff;
        border: none;
        border-radius: 5px;
        text-decoration: none;
        font-weight: 600;
        transition: background-color 0.3s;
      }
      .container a:hover {
        background-color: #0056b3;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 253 64">
        <defs>
          <style>
            .cls-1, .cls-2 {
              fill: #eeeef0;
              stroke-width: 0px;
            }
            .cls-2 {
              fill-rule: evenodd;
            }
          </style>
        </defs>
        <path class="cls-2" d="M48,.1H16C7.2.1,0,7.3,0,16.1v32c0,8.8,7.2,16,16,16h32c8.8,0,16-7.2,16-16V16.1C64,7.3,56.8.1,48,.1ZM48,23.5c0,.7-.4,1.3-.9,1.6l-2.5,1.4-2.5,1.4c-.6.4-1.3.4-1.9,0l-2.5-1.4h-.1c0,0,2.7-3.9,2.7-3.9l-4.7,2.7-7.6,4.3v5l7.6,4.3,2.2-1.2,2.5-1.4c.5-.4,1.3-.4,1.9,0l2.5,1.4,2.5,1.4c.6.3,1,1,.9,1.6v5.7c0,.7-.4,1.3-.9,1.6l-2.5,1.4-2.5,1.4c-.6.4-1.3.4-1.9,0l-2.5-1.4-2.5-1.4c-.6-.3-1-1-.9-1.6v-5.3l-11.7-6.6,2.3,3.3-2.9,1.6c-.6.4-1.3.4-1.9,0l-2.5-1.4-2.5-1.4c-.6-.3-.9-.9-.9-1.6v-5.7c0-.7.4-1.3.9-1.6l2.5-1.4,2.5-1.4c.6-.4,1.3-.4,1.9,0l2.5,1.4,2.2,1.2,7.6-4.3v-5.3c0-.7.4-1.3.9-1.6l2.5-1.4,2.5-1.4c.6-.4,1.3-.4,1.9,0l2.5,1.4,2.5,1.4c.6.3,1,1,.9,1.6v5.7Z"/>
        <path class="cls-1" d="M83.5,48h-4.7V15.8h5.3v13.3c.9-1,2-1.7,3.3-2.2,1.3-.5,2.6-.8,4.1-.8s3.8.5,5.4,1.5c1.6,1,2.8,2.3,3.7,4,.9,1.7,1.4,3.6,1.4,5.7s-.5,4-1.4,5.7c-.9,1.7-2.1,3-3.7,4-1.6,1-3.4,1.5-5.4,1.5s-3-.3-4.4-.9c-1.3-.6-2.4-1.5-3.4-2.5l-.3,3ZM90.4,43.7c1.2,0,2.3-.3,3.2-.8.9-.6,1.7-1.3,2.2-2.3.5-1,.8-2.1.8-3.3s-.3-2.3-.8-3.3c-.5-1-1.3-1.7-2.2-2.3-.9-.6-2-.9-3.2-.9s-2.2.3-3.1.8c-.9.5-1.6,1.2-2.2,2.1s-.9,1.9-1,3v1c0,1.1.4,2.2.9,3.1.6.9,1.3,1.6,2.2,2.1.9.5,1.9.8,3.1.8ZM115.3,48.4c-2.2,0-4.2-.5-5.9-1.5-1.7-1-3.1-2.3-4.1-4-1-1.7-1.5-3.6-1.5-5.7s.5-4,1.5-5.7c1-1.7,2.4-3,4.1-4,1.7-1,3.7-1.5,5.9-1.5s4.1.5,5.8,1.5c1.7,1,3.1,2.3,4,4,1,1.7,1.5,3.6,1.5,5.7s-.5,4-1.5,5.7c-1,1.7-2.3,3-4,4-1.7,1-3.7,1.5-5.8,1.5ZM115.3,43.7c1.1,0,2.2-.3,3.1-.8.9-.6,1.6-1.3,2.1-2.3.5-1,.8-2.1.8-3.3s-.3-2.3-.8-3.3c-.5-1-1.2-1.7-2.1-2.3s-1.9-.8-3.1-.8-2.2.3-3.1.8c-.9.6-1.6,1.3-2.1,2.3-.5,1-.8,2-.8,3.3s.3,2.3.8,3.3c.5,1,1.2,1.7,2.1,2.3.9.6,1.9.8,3.1.8ZM143.9,47.4c-1.6.7-3.1,1-4.6,1s-2.8-.3-4-1c-1.1-.6-2-1.5-2.7-2.7-.6-1.2-.9-2.5-.9-4v-9.5h-3.8v-4.7h4v-5.4h5v5.4h6.1v4.7h-6.1v8.5c0,1.2.3,2.2,1,2.9.7.7,1.5,1.1,2.5,1.1s1.8-.3,2.6-.8l.7,4.6ZM152.2,58.7h-5.3V26.5h4.7l.3,3c.9-1.1,2.1-1.9,3.4-2.5,1.3-.6,2.8-.9,4.4-.9s3.8.5,5.4,1.5c1.6,1,2.8,2.3,3.7,4,.9,1.7,1.4,3.6,1.4,5.7s-.5,4-1.4,5.7c-.9,1.7-2.1,3-3.7,4-1.6,1-3.4,1.5-5.4,1.5s-2.8-.3-4.1-.8c-1.3-.5-2.4-1.3-3.3-2.2v13.3ZM158.5,43.7c1.2,0,2.3-.3,3.2-.8.9-.6,1.7-1.3,2.2-2.3.5-1,.8-2.1.8-3.3s-.3-2.3-.8-3.3c-.5-1-1.3-1.7-2.2-2.3-.9-.6-2-.8-3.2-.8s-2.2.3-3.1.8c-.9.5-1.7,1.2-2.2,2.1-.6.9-.9,1.9-1,3v1.2c.1,1.1.4,2.1,1,3,.6.9,1.3,1.6,2.2,2.1.9.5,1.9.7,3.1.7ZM178.7,48h-5.3v-21.5h4.6l.2,3.9c.7-1.4,1.7-2.4,3-3.2,1.3-.8,2.7-1.1,4.4-1.1s.9,0,1.3,0c.5,0,.9.1,1.4.3l-.6,4.8c-.9-.3-1.7-.4-2.6-.4-1.3,0-2.4.3-3.3.9-.9.6-1.7,1.4-2.2,2.4-.5,1-.8,2.2-.8,3.6v10.2ZM209.9,45.5c-2.7,1.9-5.6,2.9-8.8,2.9s-4.4-.5-6.2-1.5c-1.8-1-3.3-2.4-4.4-4.1-1.1-1.7-1.6-3.7-1.6-5.9s.5-3.9,1.4-5.6c1-1.6,2.3-2.9,4-3.9,1.7-.9,3.6-1.4,5.7-1.4s4.1.5,5.8,1.6c1.7,1,3,2.5,3.9,4.3.9,1.8,1.4,4,1.4,6.4v.7h-16.5c.3,1,.7,1.8,1.4,2.6.7.7,1.5,1.3,2.4,1.7,1,.4,2.1.6,3.3.6,2.3,0,4.4-.7,6.4-2.2l1.8,3.7ZM194.4,36h11.9c-.1-1.1-.4-2-1-2.8-.5-.8-1.2-1.4-2.1-1.9-.8-.5-1.8-.7-2.9-.7s-2,.2-2.9.7c-.8.5-1.5,1.1-2.1,1.9-.5.8-.9,1.7-1,2.8ZM213,46.2l1.2-4.6c.5.5,1.1.9,1.8,1.3.7.4,1.4.7,2.2.9.8.2,1.6.3,2.3.3s1.8-.2,2.4-.6c.6-.4.9-1,.9-1.7s-.2-1-.6-1.4c-.4-.4-.9-.7-1.5-1-.6-.3-1.3-.6-2-.8-.9-.3-1.9-.8-2.9-1.2-1-.5-1.8-1.1-2.4-1.9-.6-.8-1-1.9-1-3.2s.3-2.4,1-3.3c.7-.9,1.6-1.6,2.8-2.1,1.2-.5,2.5-.8,4.1-.8,2.5,0,4.9.6,7.4,1.8l-1.5,4.3c-.5-.3-1-.7-1.7-.9-.7-.3-1.3-.5-2-.7-.7-.2-1.3-.3-1.9-.3-.8,0-1.5.2-2,.5-.5.4-.7.8-.7,1.4s.1.8.4,1.1c.3.3.7.6,1.3.9.6.3,1.3.6,2.2,1,1,.4,1.9.8,2.9,1.3,1,.5,1.8,1.1,2.5,2,.7.8,1,1.9,1,3.2s-.4,2.5-1.1,3.5c-.7,1-1.7,1.8-3,2.3-1.3.5-2.7.8-4.4.8-2.8,0-5.4-.8-7.9-2.3ZM231,46.2l1.2-4.6c.5.5,1.1.9,1.8,1.3.7.4,1.4.7,2.2.9.8.2,1.6.3,2.3.3s1.8-.2,2.4-.6c.6-.4.9-1,.9-1.7s-.2-1-.6-1.4c-.4-.4-.9-.7-1.5-1-.6-.3-1.3-.6-2-.8-.9-.3-1.9-.8-2.9-1.2-1-.5-1.8-1.1-2.4-1.9-.6-.8-1-1.9-1-3.2s.3-2.4,1-3.3c.7-.9,1.6-1.6,2.8-2.1,1.2-.5,2.5-.8,4.1-.8,2.5,0,4.9.6,7.4,1.8l-1.5,4.3c-.5-.3-1-.7-1.7-.9-.7-.3-1.3-.5-2-.7-.7-.2-1.3-.3-1.9-.3-.8,0-1.5.2-2,.5-.5.4-.7.8-.7,1.4s.1.8.4,1.1c.3.3.7.6,1.3.9.6.3,1.3.6,2.2,1,1,.4,1.9.8,2.9,1.3,1,.5,1.8,1.1,2.5,2,.7.8,1,1.9,1,3.2s-.4,2.5-1.1,3.5c-.7,1-1.7,1.8-3,2.3-1.3.5-2.7.8-4.4.8-2.8,0-5.4-.8-7.9-2.3Z"/>
      </svg>
      <h1>Connection Successful</h1>
      <p>Successfully connected to your Salesforce account. You can now use the integration.</p>
      <a href="https://studio.botpress.cloud/${botId}">Open in Studio</a>
    </div>
  </body>
  </html>
`;
};
