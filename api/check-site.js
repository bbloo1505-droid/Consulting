export default function handler(req, res) {

  const { lat, lon } = req.query;

  res.status(200).json({
    message: "Site checked",
    latitude: lat,
    longitude: lon,
    mses: "unknown",
    wetlands: "unknown"
  });

}
