window.FrontendApp = (function () {
  return {
    showContactPopup: function () {
      Swal.fire({
        title: 'CONTACT ME',
        html: `
            <div style="width: 100%; height: 100%; display:flex; flex-direction: column">
                <input id="swal-input-name" type="text" class="swal2-input" autocomplte="fname" name="full-name" id="input-full-name" placeholder="Name" required>
                <input id="swal-input-email" type="email" class="swal2-input" placeholder="Email" required>
                <textarea id="swal-input-message" style="resize: none;" class="swal2-textarea" placeholder="Message" required></textarea>
            </div>
        `,
        preConfirm: () => {
          const name = document.getElementById('swal-input-name').value.trim()
          const email = document.getElementById('swal-input-email').value.trim()
          const message = document
            .getElementById('swal-input-message')
            .value.trim()

          if (!name || !message) {
            Swal.showValidationMessage('All fields are required')
          } else if (!validator.isEmail(email)) {
            Swal.showValidationMessage('Enter a valid email')
          } else {
            return fetch('/contact', {
              headers: {
                'Content-Type': 'application/json',
              },
              method: 'post',
              body: JSON.stringify({
                name,
                email,
                message,
              }),
            })
              .then((res) => res.json())
              .then(({ error, message }) => {
                if (error) {
                  throw new Error(message)
                } else {
                  Swal.fire({
                    title: 'Success',
                    icon: 'success',
                    text: message,
                  })
                }
              })
              .catch((error) => {
                Swal.showValidationMessage(error.message)
              })
          }
        },
        icon: 'info',
        width: '60rem',
        showCancelButton: true,
      })
    },
  }
})()
