const {Observable} = require('rxjs/Rx');
const bitballoon = require('bitballoon');

const TRIES_NUMBER = 10;
const DEPLOY_OPTIONS = {
  access_token: '91bb7995f32826552ee157bc2ab888286c42094ca6bf1bffa430fcd5fcef8ff1',
  site_id: 'xm-charts-arrows.bitballoon.com',
  dir: './dist'
};

Observable.create(observer => {
  bitballoon.deploy(DEPLOY_OPTIONS, error => {
    error ? observer.error(error) : observer.next()
  });
}).retryWhen(errors => errors.scan((errorCount, err) => {
  if (errorCount >= TRIES_NUMBER || typeof err === 'string' && err.includes('No such dir')) {
    throw err;
  }
  const nextTryNumber = errorCount + 1;
  console.warn(`Deploy failed because ${err}. Making new try (#${nextTryNumber}) in a second.`);
  return nextTryNumber;
}, 1).delay(300)).subscribe( // TODO: remove first delay
  next =>console.log('Deploy successfully completed!'),
  error => console.error(`
    ${error}
    ------
    Deploy failed, not trying again. 
    1. Check if files in "dist" folder exists and "index.html" exists.
    2. Check if you have proper existing "access_token".
    3. Check if you have proper existing "site_id".
    4. Check if http://bitballoon.com is live and running.`)
)
