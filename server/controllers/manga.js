const Manga = require('../models/manga');
const Category = require('../models/category');
const Chapter = require('../models/chapter');
const category = require('../models/category');
const { User, Comment } = require('../models/user');

async function getTopView(req, res) {
    const param = req.params['id'];
    const topViews = await Manga.find()
        .sort({ 'views': -1 })
        .limit(6)
        .populate({
            path: 'categories'
        })
        .lean()
    res.json(topViews)
}

async function getCategory(req, res) {
    let id = req.params.id;
    let perPage = 12;
    let page = req.query.page || 1;
    let sort = req.query.sort || 'must_views'
    let sortQuery = initSortQuery(sort);

    const newManga = await Manga.find()
        .sort({ 'createdAt': -1 })
        .limit(5)
        .populate({
            path: 'categories'
        })
        .lean()

    const category = await Category.findOne({ slug: id }).lean();
    console.log(id)
    if (!category)
        return res.redirect('/manga/categories')
    let maxPage = await Manga.countDocuments({ "categories": category._id })
    maxPage = Math.ceil(maxPage / perPage);

    const topViews = await getMangaTopviews();
    const newComment = await getMangaNewComment()

    const products = await Manga.find({ "categories": category._id })
        .sort(sortQuery)
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .populate({
            path: 'categories'
        })
        .lean();

    category.products = products;
    category.sort = sort
    res.render('categories', { categories: [category], topViews: topViews, newComment: newComment, pages: maxPage, currentPage: page })
}

function initSortQuery(sortOption) {
    switch (sortOption) {
        case "must_views": {
            return { "views": 1 }
        }
        case "least_views": {
            return { "views": -1 }
        }
        case "namea_z": {
            return { "title": 1 }
        }
        case "namez_a": {
            return { "title": -1 }
        }
        default: {
            return { "views": -1 }
        }
    }
}

async function getAllCategoryPage(req, res) {
    let perPage = 12;
    let page = req.query.page || 1;
    const categories = await Category.find()
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .lean();
    for await (let category of categories) {
        const mangas = await Manga.find({ categories: category._id }).limit(9).lean();
        const count = await Manga.countDocuments({ categories: category._id })
        category.mangas = mangas,
            category.count = count - 8;
    }
    const toast = { type: "error", title: "Thất bại", message: "Tải thông tin truyện thất bại" }
    res.render('all-category', { categories })
}

async function getMangaDetails(req, res) {
    var mangaSlug = req.params.manga;
    await Manga.findOne({ slug: mangaSlug })
        .lean()
        .populate('categories')
        .populate({
            path: 'chapters',
            select: 'index name views updatedAt'
        })
        .then(async function (manga) {
            const comments = await Comment.find({ onManga: manga._id }).
                lean().sort('-createdAt').populate('byUser', 'name avatar').exec()
            manga.chapters.sort(function (a, b) {
                return ((a.index == b.index) ? 0 : ((a.index > b.index) ? 1 : -1));
            })
            res.render('manga-details', {
                manga: manga,
                title: `${manga.title} | Komic`,
                script: ['manga-details','review'],
                comments: comments
            });
        })
        .catch(function (err) { console.log(err.message) });
}

function read(req, res) {
    res.render('manga-reading', {
        title: 'Lorem ipsum dolor - Chapter 1 | Komic',
        script: 'manga-reading.js'
    })
}


async function getMangaTopviews() {
    const topViews = await Manga.find()
        .sort({ 'views': -1 })
        .limit(6)
        .populate({
            path: 'categories'
        })
        .lean()

    return topViews;
}

async function getMangaNewComment() {
    // const newComment = await Comment.find()
    //     .sort({ "createdAt": -1 })
    //     .limit(6)
    //     .select({ "onManga": 1 })
    //     .lean();

    // const manga = await Manga.find({ "id": { $in: newComment } });
    // return manga;
    return []
}



async function readChapter(req, res) {
    var mangaSlug = req.params.manga;
    var chapterIndex = req.params.chapter.slice(8);
    await Manga.findOne({ slug: mangaSlug })
        .lean()
        .populate('chapters', '_id index')
        .then(async function (manga) {
            manga.chapters.sort(function (a, b) {
                return ((a.index == b.index) ? 0 : ((a.index > b.index) ? 1 : -1));
            })
            var chapter = manga.chapters.filter(function (chapter) {
                return chapter.index === chapterIndex
            })
            var comments = await Comment.find({ onManga: manga._id, onChapter: chapter[0]._id })
                .lean().sort('-createdAt').populate('byUser', 'name avatar').exec()
            await Chapter.findById(chapter[0]._id)
                .lean()
                .populate('sections', 'url')
                .then(function (chapter) {
                    res.render('manga-reading', {
                        chapter: chapter,
                        manga: manga,
                        comments: comments,
                        title: `${manga.title} - Chapter ${chapter.index} | Komic`,
                        script: ['manga-reading','review']
                    })
                })
        })
        .catch((err) => console.log(err));
}

module.exports = { getMangaDetails, read, readChapter, getTopView, getCategory, getAllCategoryPage, getMangaTopviews, getMangaNewComment };

