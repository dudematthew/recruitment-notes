import { NoteItem } from './components/note-component.js';

let note = new NoteItem();
note.title = 'Dynamic Note';
note.content = 'This is dynamic content';
note.date = new Date(2024, 4, 22); // May 22, 2024

note = document.querySelector('.notes').appendChild(note);

note.addEventListener('deleteNote', (event) => {
    console.log('Delete event triggered:', event.detail);
});

setTimeout(() => {
    console.log('ran');
    note.title = "Changed";
}, 5000);