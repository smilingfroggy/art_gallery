# Art Collections

Inspired by Google Arts and Culture, this web application is a platform with artworks inventory for both art providers and audiences to search, collect, curate, and display.

The aim is to facilitate the exposure of artworks that mostly sit in a warehouse or studio, to increase the interaction between arts and the audience, and create the profile of a piece of work.

- Administrators can curate online-exhibitions, manage and organize artworks and creators introductions. 

- Users can create private or public collections, and add works into collections or favorite list, whenever visiting an exhibition or simply searching for the perfect works that match their taste.

## Demo
 __[Online-demo](https://art-gallery-01.herokuapp.com/artworks?utm_source=github)__ ✨

![Imgur](https://i.imgur.com/pwk6YsP.jpg)
---
![Imgur](https://i.imgur.com/lI0YjSF.jpg)
---
![Imgur](https://i.imgur.com/1OibC3M.jpg)

## Installation
    

* Run locally

1. Clone this repository with terminal:

    ```$ git clone https://github.com/smilingfroggy/Art-Gallery.git```

2. Install packages:

    ```$ cd Art-Gallery```

    ```$ npm install ```

3. Create database and insert seeder 

    ```$ npm run rebuildDB```

4. Create `.env` file to set up environment variables


    ```$ touch .env```

    To upload image with admin account, login and create applications at https://imgur.com to get ClientID for `.env` file

5. Run it 

    ```$ npm run dev```

6. View the website at: http://localhost:3000

7. Register an account or use seed accounts to login
    - User 
        - Account：
        user1@example.com, 
        user2@example.com, 
        user3@example.com
        - PW: 12345678
    - Admin 
        - Account： admin@example.com
        - PW: root


## ERD
![ERD](https://i.imgur.com/HtdLzBY.jpg)
- The main content provided by administrator involves three main tables, Exhibition, Artwork, and Artist.
- Both Exhibition & Artwork, Artwork & Artist have many-to-many relationships, as works are allowed to display in different exhibition and artworks can be created by multiple artists.
- Table Exhibition, Artwork, and Artist all have multiple images belonging to them.
- Artwork table has additional relation with Subject and Media, belongs to many subjects and belongs to one media.
- Collection is another table created by and belongs to an user, with various works that can be added to different collections.


## Features

### User
- Browse public exhibitions's introduction and artworks
- Search works with multiple queries: name, artist, media, size, create year, shape, and subjects.
- Artwork introduction connects with related subjects, media, and creator.
- Artist personal page with biography, all works, media, subjects, and exhibitions.
- Works, exhibitions, artists, subjects, media are all interconnected.
- Browse other users' public collections. 
- Guest users can only browse public exhibitions, collections, and search artworks.

### Logged-in User
- All above features
- Add works from websites mentioned above to their favorite list, private by default.
- Create their own collection, manage privacy, edit description, and delete it.
- Add or remove artworks to their own collections wherever in this website.
- Edit profile

### Admin
- Create, edit, and delete artwork information and images.
- Create, edit, and delete exhibitions information and image.
- Search and select artworks from inventory, and add to exhibitions.
 
### API
- Sign up and login with JWT
- Get exhibitions
- Get and search for artwork


## Future work

### User
- [x] Edit one's own profile
- [ ] Collections can be set to allow only users with exclusive links to view. 
- [ ] Add inquiry function to artworks searching page.
- [ ] Add exhibition records to individual artwork page.

### Admin
- [x] Create, edit, and delete artist data and related images.
- [ ] Create, edit, and delete subject data.
- [ ] Read the summary table with viewCounts and total of joinedCollection and addedFavorite of each work.
- [ ] Create QRcode of artwork page, and export all QRcode of works joined in certain exhibition.
- [ ] Response inquiry from users.

<!--

### Others
- API version with JWT authentication
- Cache artworks front page, top 20% viewCounts artwork, active users' collections. -->

<!-- ### Precautions? -->

## Dependencies 
- Node.js
- MySQL
- Sequelize, Sequelize-cli
- Express.js
- Express-handlebars
- Express-session
- bcryptjs
- connect-flash
- cors
- dotenv
- faker
- method-override
- multer
- imgur
- passport
- passport-local
- passport-jwt
- xlsx

### Dev Dependencies
- chai
- mocha
- nyc
- sinon
- supertest