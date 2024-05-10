// sidebar collapsed when on mobile
var element = document.getElementById('sidebar'); // Change 'yourElementId' to your actual element's ID
    if (window.innerWidth <= 768) { // 768px is often used as a breakpoint for mobile devices
        element.classList.add('collapsed'); // Change 'yourClassName' to the class you want to remove
    }
