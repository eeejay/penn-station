My Phone
========

This is the very creatively named **My Phone**. The objective of this project is to create a seamless web experience for phone calls and SMS with both mobile and desktop in mind. It is inspired by Firefox OS. Hopefully it will run on it soon.

Hacking
-------
To start playing around with this app you must follow these steps:

 1. Create a Twilio account and purchase a number.
 1. Run `npm install`
 1. Set either `LOCALTUNNEL` or `NGROK` environment variables to your favorite subdomain. From experience ngrok seems to need a paid account to work, but is slightly more reliable that.
 1. Run `npm start` and use the URL given in the output in your browser.

> **Browser support**
> 
> So far, I have only been testing this in Firefox Nightly on desktop. In the future we need to extend support to all browsers. Here are some prefs that need to be enabled:
> 
> - `dom.serviceWorkers.enabled` (this is enabled by default in Nightly)
> - `dom.push.enabled` (this is enabled by default in Nightly)
> - `dom.webcomponents.enabled` (needs to be enabled in Nightly)
