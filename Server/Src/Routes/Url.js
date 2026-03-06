const express= require('express');
const {handleRedirect , handleShortenUrl}=require('../Controllers/Url')

const router= express.Router();

router.post('/' ,handleShortenUrl);
router.get('/:shortCode' , handleRedirect);

module.exports= router;