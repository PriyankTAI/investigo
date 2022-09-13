module.exports = (doc, req) => {
    const accepted = ['en', 'fr'];
    let language = accepted.includes(req.headers['accept-language'])
        ? req.headers['accept-language']
        : 'en';
    const lang = doc[language];
    const newDoc = { ...doc._doc, ...lang }
    delete newDoc.en;
    delete newDoc.fr;
    return newDoc;
}

// const newDoc = { ...doc.toObject(), ...lang } // can include options
// https://stackoverflow.com/questions/7503450/how-do-you-turn-a-mongoose-document-into-a-plain-object