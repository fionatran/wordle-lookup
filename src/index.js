import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import logo from './logo.png';
import dictionary from './wordle_solutions.txt';

const wordLen = 5;
const maxGuessCount = 8;

function ModalContent(props) {
  return (
    <div className="modal-content content">
      <div className="box">
        <h3 className="title is-3">About</h3>
        <p>This app looks up your Wordle guesses to find matches in the NY Times <a href="https://static.nytimes.com/newsgraphics/2022/01/25/wordle-solver/assets/solutions.txt">list of possible solutions</a>. There are 2,309!</p>
        <p>Designed and built by <a href="https://fionatran.ca">Fiona Tran</a> with React and Bulma.</p>
      </div>
    </div>
  );
}

class Guess extends React.Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleKey = this.handleKey.bind(this);
  }

  handleChange(event) {
    const i = this.props.guessNumber;
    this.props.onChange(i, event.target.placeholder, event.target.value.toLowerCase());
  }

  handleKey(event) {
    if (event.key === 'Enter') {
      this.props.onSubmit();
    } else if (this.props.guessNumber === this.props.guessCount
      && event.key === 'Tab' 
      && !event.shiftKey 
      && event.target.placeholder === 'Status'){
      this.props.onAddGuess();
    }
  }

  render() {
    const focus = this.props.guessNumber === 0;
    const hasValError = this.props.hasValError;
    const wordInputClassName = 'input ' + ((hasValError[0]) ? 'is-danger' : '');
    const statusInputClassName = 'input ' + ((hasValError[1]) ? 'is-danger' : '');

    return (
      <div className="panel-block">
        <div className="field is-horizontal">
          <div className="field-label is-normal">
            <label className="label">{this.props.guessNumber+1}</label>
          </div>
          <div className="field-body">
            <div className="field">
              <div className="control">
                <input className={wordInputClassName} type="text" placeholder="Word" autoFocus={focus} onChange={this.handleChange} onKeyDown={this.handleKey} />
              </div>
            </div>
            <div className="field">
              <div className="control">
                <input className={statusInputClassName} type="text" placeholder="Status" onChange={this.handleChange} onKeyDown={this.handleKey} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

class WordleLookup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      guessCount: 0,
      words: [""],
      statuses: [""],
      result: [],
      hasValError: [[false, false]],
      searchEnabled: false,
      isModal: false
    };
    this.checkValError = this.checkValError.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleAddGuess = this.handleAddGuess.bind(this);
    this.handleDeleteGuess = this.handleDeleteGuess.bind(this);
    this.search = this.search.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
  }

  checkValError () {
    let guessCount = this.state.guessCount;
    let words = this.state.words;
    let statuses = this.state.statuses;
    let hasValError = this.state.hasValError;
    let searchEnabled;

    searchEnabled = true;
    for (var i = 0; i <= guessCount; i++) {
      for (var j = 0; j < hasValError[0].length; j++) {
        if (hasValError[i][j]) {
          searchEnabled = false;
        }
      }
      if (words[i].length !== wordLen || statuses[i].length !== wordLen) {
        searchEnabled = false;
      }
    }

    return searchEnabled;
  }

  handleChange(i, field, value) {
    const wordRe = new RegExp('^[a-zA-Z]+$');
    const statusRe = new RegExp('^[hom]+$');
    //let guessCount = this.state.guessCount;
    let words = this.state.words;
    let statuses = this.state.statuses;
    let hasValError = this.state.hasValError;
    let searchEnabled;

    if (field === 'Word') {
      words[i] = value;
      this.setState({words: words});
    } else {
      statuses[i] = value;
      this.setState({statuses: statuses});
    }

    if (value.length > wordLen || 
      (field === 'Word' && !value.match(wordRe)) ||
      (field === 'Status' && !value.match(statusRe))) {
      searchEnabled = false;
      if (field === 'Word') {
        hasValError[i][0] = true;
      } else {
        hasValError[i][1] = true;
      }
    } else {
      if (field === 'Word') {
        hasValError[i][0] = false;
      } else {
        hasValError[i][1] = false;
      }

      searchEnabled = this.checkValError();
    }
    
    this.setState({searchEnabled: searchEnabled});
  }

  async handleSubmit() {
    let guessCount = this.state.guessCount
    let words = this.state.words;
    let statuses = this.state.statuses;
    let hasValError = this.state.hasValError;
    let searchEnabled = this.checkValError();

    for (var i = 0; i <= guessCount; i++) {
      if (words[i].length !== wordLen) {
        hasValError[i][0] = true;
        searchEnabled = false;
      }
      if (statuses[i].length !== wordLen) {
        hasValError[i][1] = true;
        searchEnabled = false;
      }
    }
    this.setState({
      hasValError: hasValError, 
      searchEnabled: searchEnabled
    });

    await this.search();
  }

  async handleAddGuess() {
    let guessCount = this.state.guessCount;
    let words = this.state.words;
    let statuses = this.state.statuses;
    let hasValError = this.state.hasValError;

    if (guessCount < maxGuessCount - 1) {
      guessCount++;
      words[guessCount] = "";
      statuses[guessCount] = "";
      hasValError[guessCount] = [false, false];
      this.setState({
        guessCount: guessCount,
        words: words,
        statuses: statuses,
        hasValError: hasValError
      });
    }
    await this.search();
  }

  async handleDeleteGuess() {
    var guessCount = this.state.guessCount;
    const words = this.state.words.slice(0, guessCount);
    const statuses = this.state.statuses.slice(0, guessCount);
    const hasValError = this.state.hasValError.slice(0, guessCount);
    guessCount--;

    await this.setState({
      words: words,
      statuses: statuses,
      guessCount: guessCount,
      hasValError: hasValError
    });

    let searchEnabled = await this.checkValError();
    await this.setState({searchEnabled: searchEnabled});
    await this.search();
  }

  async search() {
    if (this.state.searchEnabled) {
      let words = this.state.words;
      let statuses = this.state.statuses;
      const result = await searchDictionary(words, statuses);
      this.setState({result: result});
    }
  }

  toggleModal() {
    this.setState((prev, props) => {
      const newState = !prev.isModal;
      return {isModal: newState};
    });
  }

  render() {
    const result = this.state.result;
    const modalClass = "modal " + (this.state.isModal ? "is-active" : "");

    const hasValError = this.state.hasValError;
    var valErrorMessage = '';
    for (var i = 0; i < hasValError.length; i++) {
      for (var j = 0; j < hasValError[0].length; j++) {
        if (hasValError[i][j]) {
          valErrorMessage = (
            <article className="message is-danger">
              <div className="message-body">This form has errors.</div>
            </article>
            );
        }
      }
    }

    const guessCount = this.state.guessCount;
    var guessArray = [];
    for (i = 0; i <= guessCount; i++) {
      guessArray.push(<Guess 
        key={i} 
        guessNumber={i} 
        guessCount={guessCount}
        hasValError={hasValError[i]}
        onChange={this.handleChange} 
        onAddGuess={this.handleAddGuess} 
        onSubmit={this.handleSubmit} />);
    }

    var addButton = "";
    if (guessCount < maxGuessCount - 1) {
      addButton = (
        <button className="button is-link is-light" onClick={this.handleAddGuess}>
          <span className="material-symbols-rounded">add</span>Guess
        </button>);
    }

    var deleteButton = "";
    if (guessCount > 0) {
      deleteButton = (
        <button className="button is-danger is-light" onClick={this.handleDeleteGuess}>
          <span className="material-symbols-rounded">remove</span>Guess
        </button>);
    }

    let words;
    if (result.length === 0) {
      words = 'Matches will show up here';
    } else {
      words = result.map((w, i) => {
        return (
          <li key={w}><a href={"https://en.wiktionary.org/wiki/"+w}>{w}</a></li>
        );
      });
    }

    return (
      <>
      <nav className="navbar is-primary has-shadow" aria-label="main navigation">
        <div className="navbar-brand">
          <a className="navbar-item" href="./"><img src={logo} alt="Wordle Lookup logo" /></a>
        </div>
        <div className="navbar-end">
          <div role="button" className="navbar-item pointer" onClick={this.toggleModal}>
            <span className="material-symbols-rounded">help</span>
          </div>
        </div>
      </nav>
      <div className="page-container">
        <div className="columns">
          <div className="column is-one-third">
            <nav className="panel">
              <p className="panel-heading">Past Guesses</p>
              <div className="panel-block">
                <p className="content">Enter each guessed <strong>word</strong> and the <strong>status</strong> of each letter in the word (hit = h, miss = m, off = o).</p>
              </div>
              {valErrorMessage}
              {guessArray}
              <div className="panel-block buttons is-centered">
                {addButton}
                {deleteButton}
                <button className="button is-primary" onClick={this.handleSubmit}>
                  Search
                </button>
              </div>
            </nav>
          </div>
          <div className="column">
            <div className="matches box">
              <h4 className="title is-5">Matches ({result.length})</h4>
              <ul className="matches-list">{words}</ul>
            </div>
          </div>
        </div>
      </div>
      <div id="modal-help" className={modalClass}>
        <div className="modal-background" onClick={this.toggleModal}></div>
        <ModalContent />
        <button className="modal-close is-large" aria-label="close" onClick={this.toggleModal}></button>
      </div>
      </>
    );
  }
}

// ========================================

document.body.classList.add('is-fullheight');
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<WordleLookup />);

async function searchDictionary(words, statuses) {
  var expArray = new Array(wordLen).fill(null);
  var hits = new Array(wordLen).fill("");
  var misses = new Array(wordLen).fill("");
  var onLetters = [];
  var offs = new Array(wordLen).fill("");
  var offUniversal = [];
  var offLetters = [];
  let letterIndex;
  let letter;
  var searchRe = '(?=';
  var result = [];

  if ((words.length === 1 || statuses.length === 1) && (words[0] === "" || statuses[0] === "")) {
    return result;
  }

  for (let i = 0; i < words.length && i < statuses.length; i++) {
    onLetters[i] = new Array(26).fill(0);
    offLetters[i] = new Array(26).fill(0);
    for (let j = 0; j < wordLen && words[i] !== "" && words[i] !== ""; j++) {
      letterIndex = words[i].charCodeAt(j) - 97;
      switch(statuses[i].charAt(j)) {
        case 'h':
          hits[j] = words[i].charAt(j);
          onLetters[i][letterIndex]++;
          break;
        case 'o':
          offs[j] = words[i].charAt(j);
          offLetters[i][letterIndex]++;
          break;
        case 'm':
          misses[j] += words[i].charAt(j);
          onLetters[i][letterIndex]++;
          break;
        default:
      }
    }
  }

  var onLettersCount = new Array(26).fill(0);
  var offLettersCount = new Array(26).fill(0);
  for (let i = 0; i < onLetters.length; i++) {
    for (let j = 0; j < onLetters[0].length; j++) {
      if (onLetters[i][j] > onLettersCount[j]) {
        onLettersCount[j] = onLetters[i][j];
      }
      if (offLetters[i][j] > offLettersCount[j]) {
        offLettersCount[j] = offLetters[i][j];
      }
    }
  }

  for (let i = 0; i < 26; i++) {
    letter = String.fromCharCode(i + 97);
    if (offLettersCount[i] > 0) {
      if (onLettersCount[i] === 0) {
        offUniversal += letter;
      } else {
        for (let j = 0; j < wordLen; j++) {
          if (hits[j] === letter) {
            offUniversal += letter;
            break;
          }
        }
      }
    }
  }

  for (let i = 0; i < wordLen; i++) {
    if (hits[i] !== "") {
      expArray[i] = hits[i];
    } else {
      expArray[i] = '[^' + misses[i] + offs[i] + offUniversal + ']';
    }
    searchRe += expArray[i];
  }

  searchRe += ')';

  for (let i = 0; i < 26; i++) {
    if (onLettersCount[i] > 0) {
      letter = String.fromCharCode(i + 97);
      searchRe += '(?=([^' + letter + ']*' + letter + '[^' +  letter + ']*){' + onLettersCount[i] + '})';
    }
  }

  let re = new RegExp(searchRe);

  await fetch(dictionary)
    .then(r => r.text())
    .then(text => {
      const lines = text.split("\n");
      for (const entry of lines) {
        if (entry.match(re) != null) {
          result.push(entry);
        }
      }
    });
  return result;
}