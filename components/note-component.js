export default class NoteComponent extends HTMLElement {
    constructor() {
        super();
        this._title = this.getAttribute('title') || '';
        this._content = this.getAttribute('content') || '';
        this._date = new Date(this.getAttribute('date') || Date.now());

        this.classList.add('note');
    }

    connectedCallback() {
        this.#render();
        this.#attachEventListeners();
    }

    #render() {
        const dateISO = this._date.toISOString().split('T')[0];
        const formattedDate = this.#formatDateToMonthDay(this._date);

        this.innerHTML = `
            <div class="note__header">
                <h6 class="note-title">${this._title}</h6>
                <div class="note__header__buttons">
                    <i class="icon icon--edit"></i>
                    <i class="icon icon--trash-can"></i>
                </div>
            </div>
            <div class="note__body">
                <p class="note-content">${this._content}</p>
            </div>
            <time datetime="${dateISO}" class="note__date">${formattedDate}</time>
        `;
    }

    #formatDateToMonthDay(date) {
        const options = { month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    #attachEventListeners() {
        this.querySelector('.icon--edit').addEventListener('click', () => this.#handleEdit());
        this.querySelector('.icon--trash-can').addEventListener('click', () => this.#handleDelete());
    }

    #handleEdit() {
        const event = new CustomEvent('editNote', { detail: { title: this._title } });
        this.dispatchEvent(event);
    }

    #handleDelete() {
        const event = new CustomEvent('deleteNote', { detail: { id: this.id } }); // Use the ID
        this.dispatchEvent(event);
    }

    set title(newTitle) {
        this._title = newTitle;
        this.#render();
    }

    set content(newContent) {
        this._content = newContent;
        this.#render();
    }

    set date(newDate) {
        this._date = new Date(newDate);
        this.#render();
    }

    get title() {
        return this._title;
    }

    get content() {
        return this._content;
    }

    get date() {
        return this._date;
    }

    get id() {
        return this.getAttribute('id');
    }

    set id(newId) {
        this.setAttribute('id', newId);
    }
}

// Register the component
customElements.define('note-item', NoteComponent);
