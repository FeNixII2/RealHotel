class Footer extends HTMLElement {
    constructor() {
        super();
    }
    // style="background-color: #e0e0e0;"
    connectedCallback() {
        this.innerHTML = `

        <footer class="footer bg-dark text-white text-center mt-auto py-5" style="width: 100vw;">
        <div class="container">
            <ul class="nav justify-content-center border-bottom pb-5 mb-3">
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
        </div>
    </footer>
        `;
    }
}

customElements.define("footer-component", Footer);