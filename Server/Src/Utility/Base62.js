
const alphabets = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const base= alphabets.length;

function encode(num){
    if(num==0) return alphabets[0];

    let encoded="";
    while(num> 0){
        let curr= num% base;
        encoded= alphabets[curr] + encoded;
        num= Math.floor(num/base);
    }
    return encoded;
}

function decode(str){
    let decoded=0;
    for(let i=0;i<str.length;i++){
        let curr= alphabets.indexOf(str[i]);
        decoded= (decoded*base) + curr;
    }
    return decoded;
}

module.exports={encode , decode};