(function() {
  // populate contacts

  var contactsModel = [];
  var contactsList = document.getElementById('contacts-list');

  contactsList.configure({
    getItemImageSrc(item) { return item.image }
  });

  fetch('/contacts-list', { credentials: 'include' }).then(
    response => response.json()).then(contacts => {
      for (var contact of contacts.results) {
        contactsModel.push(
          { title: contact.user.name.first + ' ' + contact.user.name.last,
            phone: contact.user.cell, image: contact.user.picture.thumbnail });
      }
      contactsList.setModel(contactsModel);
    });
})();