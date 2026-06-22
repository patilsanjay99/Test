import http from 'http';
http.get('http://0.0.0.0:3000/api/v1/data/SalesInvoices', (res) => {
  let data = '';
  res.on('data', (d) => data += d);
  res.on('end', () => console.log(data));
});
