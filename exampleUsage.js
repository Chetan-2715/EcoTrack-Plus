const supabase = require('./supabaseClient');

async function getData() {
  const { data, error } = await supabase
    .from('your_table')
    .select('*');
  if (error) console.error(error);
  else console.log(data);
}

getData();