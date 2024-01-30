
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
  
  export async function createAlbumsObject(clientId, clientSecret, albumesJSON) {
    const accessToken = await getAccessToken(clientId, clientSecret);
  
    // Leer el archivo albumes.json
    const albumes = albumesJSON.albumes;
  
    // Crear un objeto con los datos del archivo y las URLs de las carátulas
    const albumsObject = [];
    for (let i = 0; i < albumes.length; i += 20) {
      // Obtener los IDs de los álbumes
      const ids = albumes.slice(i, i + 20).map(album => album.link);
  
      // Obtener los enlaces de las carátulas de los álbumes
      const coverLinks = await getAlbums(accessToken, ids.join(','));
  
      // Añadir los álbumes al objeto
      for (let j = 0; j < coverLinks.length; j++) {
        albumsObject.push({
          ...albumes[i + j],
          cover_link: coverLinks[j]
        });
      }
    }
  
    return albumsObject;
  }