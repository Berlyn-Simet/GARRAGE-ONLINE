document.addEventListener('DOMContentLoaded', () => {

    // Variables globales y selectores del DOM
    const productsContainer = document.getElementById('productsContainer');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const searchInput = document.getElementById('searchInput');
    const cartCountSpan = document.getElementById('cartCount');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalSpan = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const processPaymentBtn = document.getElementById('processPaymentBtn');

    // Instancias de Modales de Bootstrap
    const quantityModal = new bootstrap.Modal(document.getElementById('quantityModal'));
    const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
    const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));

    let vehiclesData = []; // Almacena todos los vehículos del JSON
    let cart = []; // Almacena los ítems del carrito

    // URL del JSON con los datos de los vehículos
    const JSON_URL = 'https://raw.githubusercontent.com/Berlyn-Simet/vehiculos_json/main/vehiculos.json';

    /**
     * Carga los datos de los vehículos desde el archivo JSON.
     * Utiliza async/await para manejar la asincronía de la Fetch API.
     */
    async function loadVehicles() {
        showSpinner(true);
        try {
            const response = await fetch(JSON_URL);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            const data = await response.json();
            
            // CORRECCIÓN: El JSON es un array, no un objeto con la propiedad "vehiculos".
            // Se asigna 'data' directamente a la variable.
            vehiclesData = data;

            displayVehicles(vehiclesData);
        } catch (error) {
            console.error('Error al cargar los vehículos:', error);
            productsContainer.innerHTML = `<p class="text-danger text-center">No se pudieron cargar los vehículos. Inténtalo de nuevo más tarde.</p>`;
        } finally {
            showSpinner(false);
        }
    }

    /**
     * Muestra u oculta el spinner de carga.
     * @param {boolean} show - True para mostrar, false para ocultar.
     */
    function showSpinner(show) {
        loadingSpinner.style.display = show ? 'block' : 'none';
    }

    /**
     * Muestra los vehículos en la página creando tarjetas de producto.
     * @param {Array} vehicles - El array de vehículos a mostrar.
     */
    function displayVehicles(vehicles) {
        productsContainer.innerHTML = ''; // Limpiar el contenedor
        if (!vehicles || vehicles.length === 0) {
            productsContainer.innerHTML = '<p class="text-center">No se encontraron vehículos con ese criterio.</p>';
            return;
        }

        vehicles.forEach(vehicle => {
            const card = document.createElement('div');
            card.className = 'col-lg-4 col-md-6 col-sm-12 mb-4';
            
            // Limpiar emojis del campo 'tipo'
            const vehicleType = vehicle.tipo ? vehicle.tipo.replace(/[\u{1F600}-\u{1F64F}]/gu, '').trim() : 'No especificado';

            card.innerHTML = `
                <div class="card h-100">
                    <img src="${vehicle.imagen}" class="card-img-top" alt="${vehicle.marca} ${vehicle.modelo}" loading="lazy">
                    <div class="card-body">
                        <h5 class="card-title">${vehicle.marca} ${vehicle.modelo}</h5>
                        <p class="card-text text-muted">${vehicle.categoria} | ${vehicleType}</p>
                    </div>
                    <div class="card-footer text-center">
                         <p class="h5 text-primary fw-bold mb-3">$${vehicle.precio_venta.toLocaleString('es-CL')}</p>
                         <button class="btn btn-primary w-100 addToCartBtn" data-codigo="${vehicle.codigo}">Añadir al Carrito</button>
                    </div>
                </div>
            `;
            productsContainer.appendChild(card);
        });
        addAddToCartListeners(); // Añadir listeners a los nuevos botones
    }

    /**
     * Filtra los vehículos según el texto de búsqueda y los muestra.
     */
    function filterVehicles() {
        const query = searchInput.value.toLowerCase();
        const filteredVehicles = vehiclesData.filter(v =>
            v.marca.toLowerCase().includes(query) ||
            v.modelo.toLowerCase().includes(query) ||
            v.categoria.toLowerCase().includes(query)
        );
        displayVehicles(filteredVehicles);
    }

    /**
     * Añade listeners a todos los botones "Añadir al Carrito".
     */
    function addAddToCartListeners() {
        const buttons = document.querySelectorAll('.addToCartBtn');
        buttons.forEach(button => {
            button.addEventListener('click', (event) => {
                const vehicleCode = parseInt(event.target.dataset.codigo, 10);
                const selectedVehicle = vehiclesData.find(v => v.codigo === vehicleCode);
                showQuantityModal(selectedVehicle);
            });
        });
    }

    /**
     * Muestra el modal para seleccionar la cantidad y configura su botón.
     * @param {Object} vehicle - El vehículo seleccionado.
     */
    function showQuantityModal(vehicle) {
        const quantityInput = document.getElementById('quantityInput');
        quantityInput.value = 1; // Resetear cantidad
        
        const addToCartBtn = document.getElementById('addToCartBtn');
        
        // Clonar y reemplazar el botón para eliminar listeners antiguos
        const newBtn = addToCartBtn.cloneNode(true);
        addToCartBtn.parentNode.replaceChild(newBtn, addToCartBtn);

        newBtn.onclick = () => {
            const quantity = parseInt(quantityInput.value, 10);
            if (quantity > 0) {
                addItemToCart(vehicle, quantity);
                quantityModal.hide();
            } else {
                alert("La cantidad debe ser mayor que cero.");
            }
        };

        quantityModal.show();
    }

    /**
     * Añade un ítem al carrito o actualiza su cantidad si ya existe.
     * @param {Object} vehicle - El vehículo a añadir.
     * @param {number} quantity - La cantidad de unidades.
     */
    function addItemToCart(vehicle, quantity) {
        const existingItem = cart.find(item => item.codigo === vehicle.codigo);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({ ...vehicle, quantity });
        }
        updateCartUI();
    }

    /**
     * Actualiza la interfaz del carrito (contador, modal y total).
     */
    function updateCartUI() {
        cartItemsContainer.innerHTML = '';
        let total = 0;
        let totalItems = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>El carrito está vacío.</p>';
            checkoutBtn.disabled = true;
        } else {
            checkoutBtn.disabled = false;
            cart.forEach(item => {
                const subtotal = item.precio_venta * item.quantity;
                total += subtotal;
                totalItems += item.quantity;

                const cartItemElement = document.createElement('div');
                cartItemElement.className = 'cart-item';
                cartItemElement.innerHTML = `
                    <img src="${item.logo}" alt="${item.marca} Logo" class="cart-item-logo">
                    <img src="${item.imagen}" alt="${item.marca} ${item.modelo}" class="cart-item-img">
                    <div class="cart-item-details">
                        <strong>${item.marca} ${item.modelo}</strong>
                        <p>Cantidad: ${item.quantity} x $${item.precio_venta.toLocaleString('es-CL')}</p>
                    </div>
                    <p class="fw-bold ms-auto">$${subtotal.toLocaleString('es-CL')}</p>
                `;
                cartItemsContainer.appendChild(cartItemElement);
            });
        }
        
        cartCountSpan.textContent = totalItems;
        cartTotalSpan.textContent = `$${total.toLocaleString('es-CL')}`;
        cartCountSpan.style.animation = 'pulse 0.5s';
        setTimeout(() => cartCountSpan.style.animation = '', 500);
    }

    /**
     * Genera una factura en PDF con los detalles de la compra.
     */
    function generateInvoice() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const cardName = document.getElementById('cardName').value;
        const date = new Date().toLocaleDateString('es-CL');
        let y = 20; // Posición vertical inicial

        doc.setFontSize(22);
        doc.text("Factura de Compra - Garage Online", 10, y);
        y += 15;
        
        doc.setFontSize(12);
        doc.text(`Fecha: ${date}`, 10, y);
        doc.text(`Cliente: ${cardName}`, 10, y + 7);
        y += 20;

        doc.setFontSize(14);
        doc.text("Detalle de la Compra:", 10, y);
        y += 10;
        
        doc.setFontSize(10);
        cart.forEach(item => {
            const subtotal = item.precio_venta * item.quantity;
            doc.text(`${item.marca} ${item.modelo} (x${item.quantity})`, 10, y);
            doc.text(`$${subtotal.toLocaleString('es-CL')}`, 150, y);
            y += 7;
        });

        const total = cart.reduce((sum, item) => sum + item.precio_venta * item.quantity, 0);
        y += 10;
        doc.setFontSize(16);
        doc.text(`Total a Pagar: $${total.toLocaleString('es-CL')}`, 10, y);

        doc.save(`factura-garage-online-${Date.now()}.pdf`);
    }

    // --- EVENT LISTENERS ---

    // Filtrado en tiempo real al escribir en la barra de búsqueda
    searchInput.addEventListener('input', filterVehicles);
    
    // Abrir modal de pago desde el carrito
    checkoutBtn.addEventListener('click', () => {
        cartModal.hide();
        paymentModal.show();
    });

    // Procesar el pago
    processPaymentBtn.addEventListener('click', () => {
        const paymentForm = document.getElementById('paymentForm');
        if (paymentForm.checkValidity()) {
            alert('¡Pago exitoso! Se ha generado su factura en PDF.');
            generateInvoice();
            
            // Limpiar carrito y UI
            cart = [];
            updateCartUI();
            paymentModal.hide();
        } else {
            alert('Por favor, complete todos los campos del formulario de pago.');
            paymentForm.reportValidity();
        }
    });


    // --- INICIALIZACIÓN ---
    loadVehicles();
    updateCartUI(); // Para inicializar el contador y el estado del botón del carrito
});