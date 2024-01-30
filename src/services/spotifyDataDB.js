
import { createClient } from "@libsql/client";

async function getAccessToken(clientId, clientSecret) {

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}
  
async function getAlbums(accessToken, albumIds) {
  console.log("se esta haciendo una peti")
  const response = await fetch(`https://api.spotify.com/v1/albums?ids=${albumIds}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status} rerty in ${response.headers.get('Retry-After')}`);
  }

  const data = await response.json();
  return data.albums.map(album => album.images[0].url);
}
  

async function getCoverFromDB(client, albumId) {
  const result = await client.execute(
    {

      sql: 'SELECT cover_link FROM albums WHERE id = ?',  
      args: [albumId],
    }
  );
  return result.rows.length > 0 ? result.rows[0].cover_link : null;
}

async function insertCoverIntoDB(client, albumId, coverLink) {
  await client.execute(
    {
      sql: 'INSERT INTO albums (id, cover_link) VALUES (?, ?)', 
      args: [albumId, coverLink],
    }
  );
}

export async function createAlbumsObject(clientId, clientSecret, albumesJSON) {
  const accessToken = await getAccessToken(clientId, clientSecret);
  const albumes = albumesJSON.albumes;
  const albumsObject = [];
  const client = createClient({
    url: import.meta.env.TURSO_DB_URL,
    authToken: import.meta.env.TURSO_DB_AUTH_TOKEN,
  });

  for (let i = 0; i < albumes.length; i++) {
    const albumId = albumes[i].link;
    let coverLink = await getCoverFromDB(client, albumId);

    if (!coverLink) {
      const coverLinks = await getAlbums(accessToken, [albumId]);
      coverLink = coverLinks[0];
      await insertCoverIntoDB(client, albumId, coverLink);
    }

    albumsObject.push({
      ...albumes[i],
      cover_link: coverLink
    });
  }

  return albumsObject;
}