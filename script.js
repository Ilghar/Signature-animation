const name = document.querySelector('#First-name')
const sign = document.querySelector('.signature-main')
const uppercase = document.querySelectorAll('.letter-bank .up')
const lowercase = document.querySelectorAll('.letter-bank .lo')
const signedBy = document.querySelector('.signed-by')
const modal = document.querySelector('.modal')

const signBtn = document.querySelector('.sign')
let prev = ''

// Render from the field's value, not from keystrokes: works for paste,
// autofill, mobile IMEs, non-QWERTY layouts and scripted input.
function render(value, animateFrom) {
  sign.innerHTML = ''
  value.split('').forEach((ch, i) => draw(ch, i >= animateFrom))
}

function update() {
  const v = name.value
  const common = v.startsWith(prev) ? prev.length : 0 // animate only new chars
  render(v, common)
  prev = v
  modal.classList.toggle('active', v.length > 0)
  signBtn.disabled = v.trim().length === 0
}

name.addEventListener('input', update)
signBtn.addEventListener('click', () => {
  if (!signBtn.disabled) render(name.value, 0)
})
name.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.isComposing) {
    e.preventDefault()
    signBtn.click()
  }
})

function draw(key,animate) {
  if (key == " ") {
    const space = document.createElement("div");
    space.style.minWidth = '12px'   
    sign.appendChild(space)   
  } else {
    const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i));

    for (let i = 0; i < alphabet.length; i++) {
      var item = alphabet[i]

      if (key.toLowerCase() == item) {
        const letter = document.createElement("div");  
        if (key == item.toUpperCase()) {
          letter.innerHTML = uppercase[i].innerHTML
          letter.classList.add('up')
        } else {
          letter.innerHTML = lowercase[i].innerHTML
          letter.classList.add('lo')
        }
        letter.classList.add(item)
        if (animate) {
          setTimeout(function() { 
            letter.querySelector('svg path').style.strokeDashoffset = '0'
          }, 50);
        } else {
          letter.querySelector('svg path').style.strokeDashoffset = '0'
        }
        sign.appendChild(letter)
      }
    }
  }
}

update()
