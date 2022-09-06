module.exports = (doc, req) => {
    const lang = doc[`${req.headers['accept-language'] || 'en'}`];
    const newDoc = { ...doc._doc, ...lang }
    delete newDoc.en;
    delete newDoc.fr;
    return newDoc;
}

// const newDoc = { ...doc.toObject(), ...lang } // can include options
// https://stackoverflow.com/questions/7503450/how-do-you-turn-a-mongoose-document-into-a-plain-object