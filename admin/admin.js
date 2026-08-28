// Konfigurator eventów - frontend panelu.
// Wersja produkcyjna powinna wysyłać dane do zabezpieczonego API.
document.querySelector('#eventForm').addEventListener('submit',e=>{
 e.preventDefault();
 alert('Formularz przygotowany. Podłącz backend wydarzeń, aby zapisać event.');
});
