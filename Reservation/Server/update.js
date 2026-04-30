const data=require('./meetings.json')
let cachedState = null;
let lastUpdated = 0;
let isRefreshing = false;


async function fetchFromUpstream() {
  // call external API replaced with json file for now
  //stil missing some things that i am supposed
  cachedState=data.value;
  return data.value

}

async function refreshState() {
  if (isRefreshing) return; // prevent overlapping refreshes
  isRefreshing = true;

  try {
    const fresh = await fetchFromUpstream();
    cachedState = fresh;
    lastUpdated = Date.now();
    console.log("updated data from source something")
  } finally {
    isRefreshing = false;
  }
}

function getState() {
   
  return cachedState;
}

module.exports = {
  getState,
  refreshState
};