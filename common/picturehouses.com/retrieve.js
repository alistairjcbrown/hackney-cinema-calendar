async function retrieve({ domain, cinemaId }) {
  const variables = {
    start_date: "show_all_dates",
    cinema_id: cinemaId,
  };

  const response = await fetch(`${domain}/api/get-movies-ajax`, {
    method: "POST",
    body: new URLSearchParams(variables).toString(),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
  });
  return await response.json();
}

module.exports = retrieve;
