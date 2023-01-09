const db = require('../models')
const { Artwork, Artist, ArtistImage, ArtworkImage, Medium, Subject, } = db
const { Op } = require("sequelize")
const sequelize = require("sequelize")
const helpers = require('../helpers/auth-helpers')
const IMAGE_NOT_AVAILABLE = 'https://i.imgur.com/nVNO3Kj.png'
const ARTIST_AVATAR_NOT_AVAILABLE = 'https://i.imgur.com/QJrNwMz.jpg'

const artworkService = {
  getSelections: async () => {
    const selections_artist = await Artist.findAll({ attributes: ['id', 'name'], raw: true, order: ['name'] })
    const selections_medium = await Medium.findAll({ attributes: ['id', 'name'], raw: true, order: ['name'] })
    const selections_subject = await Subject.findAll({ attributes: ['id', 'name'], raw: true, order: ['name'] })
    const selections = {
      artists: selections_artist,
      media: selections_medium,
      subjects: selections_subject
    }
    return selections
  },
  getArtworks: async (req, res) => {
    let addedArtworks = helpers.getUser(req)?.addedArtworks || new Set()
    let favoriteArtworks = helpers.getUser(req)?.favoriteArtworks || []

    const selections = await artworkService.getSelections()

    // organize query
    let { mediumId, subjectId, artistId, medium, subject, artist, artworkName,
      height_lower, height_upper, width_lower, width_upper, depth_lower, depth_upper,
      shape_portrait, shape_landscape, createYear_lower, createYear_upper, createYear_includeNone } = req.query

    let shape
    if (shape_portrait && !shape_landscape) shape = '直式'
    if (!shape_portrait && shape_landscape) shape = '橫式'

    let warning_messages = []
    let mediumId_search, subjectId_search, artistId_search
    if (mediumId) {
      mediumId_search = selections.media.find(selection => selection.id === Number(mediumId))
      if (!mediumId_search) warning_messages.push({ message: `Cannot find medium Id: ${mediumId}. ` })
    }
    if (subjectId) {
      subjectId_search = selections.subjects.find(selection => selection.id === Number(subjectId))
      if (!subjectId_search) warning_messages.push({ message: `Cannot find subject Id: ${subjectId}. ` })
    }
    if (artistId) {
      artistId_search = selections.artists.find(selection => selection.id === Number(artistId))
      if (!artistId_search) warning_messages.push({ message: `Cannot find artist Id: ${artistId}. ` })
    }

    let searching = {  // show search records
      // medium: query text or medium_search with mediumId or undefined
      medium: medium || (mediumId ? (mediumId_search?.name || undefined) : undefined),
      subject: subject || (subjectId ? (subjectId_search?.name || undefined) : undefined),
      artist: artist || (artistId ? (artistId_search?.name || undefined) : undefined),
      artworkName,
      height_lower, height_upper, width_lower, width_upper, depth_lower, depth_upper,
      height: sizeQueryText('長', height_lower, height_upper),
      width: sizeQueryText('寬', width_lower, width_upper),
      depth: sizeQueryText('深', depth_lower, depth_upper),
      shape, shape_portrait, shape_landscape,
      createYear_lower, createYear_upper, createYear_includeNone,
      year: (createYear_lower || createYear_upper) ? `${createYear_lower} - ${createYear_upper}` : undefined
    }
    // console.log(searching)

    let whereQuery = {}
    if (mediumId) whereQuery['$Medium.id$'] = Number(mediumId)
    if (subjectId) whereQuery['$SubjectTags.id$'] = Number(subjectId)
    if (artistId) whereQuery['$Creators.id$'] = Number(artistId)
    if (medium) whereQuery['$Medium.name$'] = { [Op.like]: `%${medium}%` }
    if (subject) whereQuery['$SubjectTags.name$'] = { [Op.like]: `%${subject}%` }
    if (artist) whereQuery['$Creators.name$'] = { [Op.like]: `%${artist}%` }
    if (artworkName) whereQuery['name'] = { [Op.like]: `%${artworkName}%` }
    sizeQuery('height', height_lower, height_upper, whereQuery)
    sizeQuery('width', width_lower, width_upper, whereQuery)
    sizeQuery('depth', depth_lower, depth_upper, whereQuery)
    if (shape === "直式") whereQuery['height'] = { [Op.gte]: sequelize.col('width') }
    if (shape === "橫式") whereQuery['height'] = { [Op.lte]: sequelize.col('width') }
    if (createYear_lower || createYear_upper) {
      if (createYear_includeNone) {
        whereQuery['creationTime'] = {
          [Op.or]: [{ [Op.between]: [createYear_lower || '1600', createYear_upper || '2100'] }, null]
        }
      } else {  // exclude null
        whereQuery['creationTime'] = {
          [Op.between]: [createYear_lower || '1600', createYear_upper || '2100']
        }
      }
    }

    const artwork_rawData = await Artwork.findAndCountAll({
      nest: true,
      attributes: { exclude: ['MediumId', 'viewCount', 'createdAt', 'updatedAt', 'piecesNum'] },
      where: whereQuery,
      include: [
        { model: Subject, as: 'SubjectTags', attributes: ['id', 'name'], through: { attributes: [] }, required: true },
        { model: Medium, attributes: ['id', 'name'], required: true },
        { model: ArtworkImage, attributes: ['url', 'type'] },
        {
          model: Artist, as: 'Creators', through: { attributes: [] },
          attributes: ['id', 'name'], required: true
        }
      ],
      distinct: true   // count distinct pk 
    })

    let artwork_result = JSON.parse(JSON.stringify(artwork_rawData))
    // 整理藝術品資料: medium, size
    artwork_result.rows.forEach(work => {
      work.name = work.name.slice(0, 22)
      work.creationTime = work.creationTime ? new Date(work.creationTime).getFullYear() : ""
      work.medium = work.Medium.name
      work.image = work.ArtworkImages[0]?.url || IMAGE_NOT_AVAILABLE
      delete work.Medium
      delete work.ArtworkImages
      work.size = work.depth ? (work.height + "x" + work.width + "x" + work.depth) : (work.height + "x" + work.width)
      work.isAdded = addedArtworks.has(work.id)
      work.isFavorite = favoriteArtworks.includes(work.id)
    })

    return { selections, searching, artwork_result, warning_messages }
  },
  getArtwork: async (req, res) => {
    let addedArtworks = helpers.getUser(req)?.addedArtworks || new Set()
    let favoriteArtworks = helpers.getUser(req)?.favoriteArtworks || []

    const artwork_rawData = await Artwork.findByPk(req.params.artworkId, {
      attributes: { exclude: ['MediumId', 'viewCount', 'createdAt', 'updatedAt', 'piecesNum'] },
      include: [
        { model: Subject, as: 'SubjectTags', attributes: ['id', 'name'], through: { attributes: [] } },
        { model: Medium, attributes: ['id', 'name'] },
        { model: ArtworkImage, attributes: ['url', 'type', 'description'] },
        {
          model: Artist, as: 'Creators', through: { attributes: [] },
          attributes: { exclude: ['updatedAt', 'createdAt'] },
          include: { model: ArtistImage, attributes: { exclude: ['createdAt', 'updatedAt'] } }
        }
      ]
    })
    if (!artwork_rawData) {
      res.status(404)
      throw new Error('Artwork unavailable')
    }
    let artwork = artwork_rawData.toJSON()

    // 整理藝術品資料：medium, subject, size, creationTime
    artwork.image = artwork.ArtworkImages[0]?.url || IMAGE_NOT_AVAILABLE
    artwork.size = (artwork.depth) ? (artwork.height + "x" + artwork.width + "x" + artwork.depth + " cm") : (artwork.height + "x" + artwork.width + " cm")
    artwork.creationTime = artwork.creationTime ? artwork.creationTime.getFullYear() : ""
    artwork.isAdded = addedArtworks.has(artwork.id)
    artwork.isFavorite = favoriteArtworks.includes(artwork.id)

    // 整理藝術家資料介紹
    artwork.Creators.map(creator => {
      if (creator.ArtistImages.length === 0) {
        creator.ArtistImages = ARTIST_AVATAR_NOT_AVAILABLE
      } else {
        const headImg = creator.ArtistImages.find(image => image.type === 'head')
        if (headImg) {  // imgur url + b => big thumbnail 
          creator.ArtistImages = headImg.url.split('.jpg')[0] + 'b.jpg'
        } else {
          creator.ArtistImages = creator.ArtistImages[0].url.split('.jpg')[0] + 'b.jpg'
        }
      }
      creator.introduction = creator.introduction?.slice(0, 50) + "..."
    })
    return artwork
  }
}

function sizeQueryText(dimension, lower, upper) {
  if (!lower && !upper) return undefined
  return `${dimension} ${lower ? lower : ''} - ${upper ? upper : ''}`
}

function sizeQuery(dimension, lower, upper, whereQuery) {
  if (lower && upper) {
    whereQuery[dimension] = { [Op.between]: [lower, upper] }
  } else {
    if (lower) whereQuery[dimension] = { [Op.gte]: lower }
    if (upper) whereQuery[dimension] = { [Op.lte]: upper }
  }
}

module.exports = artworkService