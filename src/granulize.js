export const granulize = (html, options={}) => {
  const config = {...{
    tags: true,
    words: true,
    characters: true,
    tagId: 'tag',
    wordId: 'word',
    characterId: 'char',
    attribute: 'data-grain',
    indexTags: true,
    indexWords: true,
    indexCharacters: true,
  }, ...options};
  let granulizedHTML = granulizeHTML(html, config);
  return granulizedHTML; 
}

function granulizeHTML(text, cfg) {
  const tag = document.createElement('div');
  tag.innerHTML = text.replace(/\s+/g, ' ').replace(/> </g, '><').trim();

  let html = parseTags(tag, null, cfg);
  if(cfg.tags === true && cfg.indexTags) html = indexGrains(html, cfg, 'tagId');
  if(cfg.words === true && cfg.indexWords) html = indexGrains(html, cfg, 'wordId');
  if(cfg.characters === true && cfg.indexCharacters) html = indexGrains(html, cfg, 'characterId');
  return html;
}

function indexGrains(html, cfg, grainId) {
  const elem = document.createElement('div');
  elem.innerHTML = html;
  elem.querySelectorAll(`[${cfg.attribute}~="${cfg[grainId]}"]`).forEach((item, i) => {
    item.style.setProperty(`--${cfg[grainId]}-index`, `${i}`);
  })  
  return elem.innerHTML;
}

function parseTags(tag, tagName, cfg) {
  const children = Array.from(tag.childNodes);
  const html = children.map(child => parseTag(child, cfg));
  if(!tagName) return html.join('');
  else if(cfg.tags === true) tag.setAttribute(cfg.attribute, `${cfg.tagId} ${cfg.tagId}-${tagName}`);
  tag.innerHTML = html.join('');
  return tag.outerHTML;
}

function parseTag(tag, cfg) {
  if(tag.localName === undefined) return parseWords(tag.textContent, cfg);
  return parseTags(tag, tag.localName, cfg);
}

function parseWords(text, cfg) {
  if(cfg.words !== true) return parseChars(text, cfg);
  const words = text.split(/\s/).map((word) => {
    const encodedWord = encodeURIComponent(word);
    return encodedWord.length === 0 ? '' : /*html*/`<span ${cfg.attribute}="${cfg.wordId} ${cfg.wordId}-${encodedWord}">${parseChars(word, cfg)}</span>`;
  })
  return words.join(' ');
}

function parseChars(word, cfg) {
  if(cfg.characters !== true) return word;
  const chars = word.split(/\.*?/g).map((char) => /*html*/`<span ${cfg.attribute}="${cfg.characterId} ${cfg.characterId}-${encodeURIComponent(char)}">${char}</span>`);
  return chars.join('');
}