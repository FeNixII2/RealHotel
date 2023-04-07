class Footer extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `

    <div class="container">
        <footer class="py-3 my-4">
          <ul class="nav justify-content-center border-bottom pb-3 mb-3">
            <li class="nav-item"><a href="#home" onclick="showSection('home')" class="nav-link px-2 text-muted">หน้าหลัก</a></li>
            <li class="nav-item"><a href="#rooms" onclick="showSection('rooms')" class="nav-link px-2 text-muted">ห้องพัก</a></li>
            <li class="nav-item"><a href="#booking" onclick="showSection('booking'),booking_search()" class="nav-link px-2 text-muted">จองห้องพัก</a></li>
            <li class="nav-item">
              <a href="#" class="nav-link px-2 text-muted"><i class="fa-brands fa-facebook"></i></a>
            </li>
            <li class="nav-item"><a href="#" class="nav-link px-2 text-muted"><i class="fa-brands fa-youtube"></i></a></li>
            <li class="nav-item"><a href="#" class="nav-link px-2 text-muted">ติดต่อ 0123456789</a></li>

          </ul>
          <p class="text-center text-muted">© 2023 โรงแรมบีเอส</p>
        </footer>
      </div>
        `;
  }
}

customElements.define("footer-component", Footer);