export const granulize = (html, options={}) => {
  const config = {...{
    tags: true,
    words: true,
    characters: true,
    tagId: 'tag',
    wordId: 'word',
    characterId: 'char',
    sentenceId: 'sentence',
    phraseId: 'phrase',
    attribute: 'data-grain',
    indexTags: true,
    indexWords: true,
    indexCharacters: true,
    indexSentences: true,
    indexPhrases: true
  }, ...options};
  let granulizedHTML = granulizeHTML(html, config);
  return granulizedHTML; 
}

function granulizeHTML(text, cfg) {
  const tag = document.createElement('div');
  tag.innerHTML = text.replace(/\s+/g, ' ').trim();

  let html = parseTags(tag, null, cfg);
  if(cfg.tags === true && cfg.indexTags) html = indexGrains(html, cfg, 'tagId');
  if(cfg.words === true && cfg.indexWords) html = indexGrains(html, cfg, 'wordId');
  if(cfg.characters === true && cfg.indexCharacters) html = indexGrains(html, cfg, 'characterId');
  if(cfg.indexSentences) html = indexSentences(html, cfg);
  if(cfg.indexPhrases) html = indexPhrases(html, cfg);
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

function indexSentences(html, cfg) {
  if(!cfg.words && !cfg.characters) return html;
  if(cfg.words === true) return indexSentencesFromWords(html, cfg);
  if(cfg.characters === true) return indexSentencesFromCharacters(html, cfg);
  return elem.innerHTML;
}

function indexSentencesFromWords(html, cfg) {
  const elem = document.createElement('div');
  elem.innerHTML = html;
  const grains = [...elem.querySelectorAll(`[${cfg.attribute}~="${cfg.wordId}"]`)];
  var sentenceIndex = 0;

  grains.forEach((grain, i) => {
    const currentWord = grain?.textContent;
    const lastWord = grains[i-1]?.textContent || '';
    const currentWordStartsWithCapital = currentWord.match(/^([A-Z]|¡|¿)/);
    const lastWordEndsWithFinalInterPunction = lastWord.match(/(\.|\!|\?)$/);
    if(currentWordStartsWithCapital && lastWordEndsWithFinalInterPunction) sentenceIndex++;
    grain.style.setProperty(`--${cfg.sentenceId}-index`, sentenceIndex);
  })

  return elem.innerHTML;
}

function indexSentencesFromCharacters(html, cfg) {
  const elem = document.createElement('div');
  elem.innerHTML = html;
  const grains = [...elem.querySelectorAll(`[${cfg.attribute}~="${cfg.characterId}"]`)];
  var sentenceIndex = 0;

  grains.forEach((grain, i) => {
    const currentCharacter = grain?.textContent;
    const lastCharacter = grains[i-1]?.textContent || '';
    const firstToLastCharacter = grains[i-2]?.textContent || '';
    const currentCharacterStartsWithCapital = currentCharacter.match(/^([A-Z]|¡|¿)/);
    const firstToLastCharacterEndsWithFinalInterPunction = firstToLastCharacter.match(/(\.|\!|\?)$/);
    const lastCharacterEqualsSpace = lastCharacter === ' ';    
    if(currentCharacterStartsWithCapital && lastCharacterEqualsSpace && firstToLastCharacterEndsWithFinalInterPunction) sentenceIndex++;
    grain.style.setProperty(`--${cfg.sentenceId}-index`, sentenceIndex);
  })

  return elem.innerHTML;
}

function indexPhrases(html, cfg) {
  const elem = document.createElement('div');
  elem.innerHTML = html;
  const grainId = cfg.words === true ? cfg.wordId : cfg.characterId;
  const grains = [...elem.querySelectorAll(`[${cfg.attribute}~="${grainId}"]`)];
  var phraseIndex = 0;

  grains.forEach((grain) => {
    const currentGrain = grain?.textContent;
    const currentGrainEndsWithInterpunction = currentGrain.match(/^(\,|\:|\;|\-|\–)/);
    grain.style.setProperty(`--${cfg.phraseId}-index`, phraseIndex);
    if(currentGrainEndsWithInterpunction) phraseIndex++;
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
  if(cfg.words !== true) return parseCharacters(text, cfg);
  const words = text.split(/\s/).map((word) => {
    const encodedWord = encodeURIComponent(word);
    return encodedWord.length === 0 ? '' : /*html*/`<span ${cfg.attribute}="${cfg.wordId} ${cfg.wordId}-${encodedWord}">${parseCharacters(word, cfg)}</span>`;
  })
  return words.join(' ');
}

function parseCharacters(word, cfg) {
  if(cfg.characters !== true) return word;
  const characters = word.split(/\.*?/g).map((char) => /*html*/`<span ${cfg.attribute}="${cfg.characterId} ${cfg.characterId}-${encodeURIComponent(char)}">${char}</span>`);
  return characters.join('');
}