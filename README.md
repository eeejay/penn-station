Penn Station
============

The objective of this project is to create a seamless web experience for phone calls and SMS with both mobile and desktop in mind. It is inspired by Firefox OS's communications suite. Hopefully it will run on it soon.

Hacking
-------
To start playing around with this app you must follow these steps:

 1. Create a Twilio account and purchase a number, take note of your account sid, auth otken and phone number.
 1. Run `npm install`
 1. Set either `LOCALTUNNEL` or `NGROK` environment variables to your favorite subdomain. From experience ngrok seems to need a paid account to work, but is slightly more reliable that.
 1. Run `npm start` and use the URL given in the output in your browser.
 1. Create an account and log in.
 1. After that, set your browser to `/settings` and put in your Twilio info. Clunky, I know..
 1. You are ready to make calls and send texts!!

> **Browser support**
> 
> So far, I have only been testing this in Firefox Nightly on desktop. In the future we need to extend support to all browsers. Here are some prefs that need to be enabled:
> 
> - `dom.serviceWorkers.enabled` (this is enabled by default in Nightly)
> - `dom.push.enabled` (this is enabled by default in Nightly)
> - `dom.webcomponents.enabled` (needs to be enabled in Nightly)

Choices, Choices, Choices
-------------------------

I think most of this should go away. But FYI we have multiple everything for everything. It is all configurable with environment variables.

### Authentication

We have 3 authentication strategies, local password, Firefox Accounts and Github. Depending on what environment variables you have set, you will get a different strategy. If you have `FXA_CLIENT_ID` defined and `FXA_CLIENT_SECRET`, you get Firefox Accounts developer instance authentication. I think it only works with `mozilla.com` gmail. If you set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`, you get Github OAuth. If none of the above is defined you get a local password store.

### Databases

We have two db backends, LevelDB and Redis. I made a polyfill for LevelDb so it behaves more or less like Redis. It isn't perfect. But, I think it is important to keep the LevelDB support so it is easy to develop locally. Set `REDIS_URL` in the environment to use Redis.

### Tunneling

This app relies heavily on public URLs. Twilio uses web hooks for incoming calls and texts. Testing this app through localhost will not work. There is some smarts that reconfigures your Twilio number and makes sure that it is synchronized with your tunnel URL. We have two tunneling choices, just because we can: **ngrok** and **localtunnel**.  Set `ROOT_URL` to either an `ngrok.io` url (eg. `https://foo.ngrok.io`) or a `localtunnel.me` one (eg. `https://foo.localtunnel.me`).

Roadmap
-------

The goal of this project is to have a communications suite that runs everywhere. Well. Right now it is just a pile of stuff I put together to make a demo. There is a long way to go for this to be a Serious application. Here are some things that need to happen in no particular order:

 - **Testing**. We need that. Maybe some Travis integration.
 - Make it perty and usable.
 - No more server-side rendering of pages or JS. Clear separation of frontend and backend. The Jade templates kind of grew on me, but we may need to kiss them goodbye in favor of static HTML.
 - Caching assets (html, css, fonts, js) via service workers.
 - Re-doing messages database schema. The entire message should be stored, not just thread id, and read/unread.
 - Implementing Recents panel. This includes push notifications for additional items.
 - Research what it would take to make this run as a certified app in b2g/b2gdroid. Does it need to be packaged? We may need a build step for creating the package, and figure out an upgrade strategy for revisions.
 - Speaking of b2g/b2gdroid. It would be cool if we took advantage of the Telephony API on those platforms and via some fancy call forwarding used the apps number.
 - Implement Contacts. Synchronize with Google or Facbook. Dunno.
