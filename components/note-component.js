/**
 * I know it's a bit of overkill for such small application but I thought 
 * I would show what benefits I would value in programming such apps.
 */
export class NoteItem extends HTMLElement {
    constructor() {
        super();
        this._title = this.getAttribute('title') || '';
        this._content = this.getAttribute('content') || '';

        const dateAttr = this.getAttribute('date');
        this._date = dateAttr ? new Date(dateAttr) : new Date();

        this.classList.add('note');
    }

    connectedCallback() {
        this._render();
        this._attachEventListeners();
    }

    _render() {
        const dateISO = this._date.toISOString().split('T')[0];
        const formattedDate = this._formatDateToMonthDay(this._date);

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

    _formatDateToMonthDay(date) {
        const options = { month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    _attachEventListeners() {
        this.querySelector('.icon--edit').addEventListener('click', () => this._handleEdit());
        this.querySelector('.icon--trash-can').addEventListener('click', () => this._handleDelete());
    }

    _handleEdit() {
        const event = new CustomEvent('editNote', { detail: { title: this._title } });
        this.dispatchEvent(event);
    }

    _handleDelete() {
        const event = new CustomEvent('deleteNote', { detail: { title: this._title } });
        this.dispatchEvent(event);
    }

    set title(newTitle) {
        this._title = newTitle;
        this._render();
    }

    set content(newContent) {
        this._content = newContent;
        this._render();
    }

    set date(newDate) {
        this._date = new Date(newDate);
        this._render();
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
}

// Register the component
customElements.define('note-item', NoteItem);
