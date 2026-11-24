/* LexTeam site configuration.

   CONTACT FORM
   provider: "netlify"   (default) Netlify Forms. Messages appear in the Netlify dashboard (Forms > contact)
                          and are emailed to the addresses set under Forms > Form notifications.
             "web3forms" set accessKey from https://web3forms.com if the site is hosted elsewhere.
             "mailto"    opens the visitor's email app (fallback, no service needed).
*/
window.LEX_CONFIG = {
  form: {
    provider: "netlify",
    web3formsKey: "",
    fallbackEmail: "info@lexteam.mk"
  }
};
