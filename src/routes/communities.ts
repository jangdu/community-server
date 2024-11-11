import { isEmpty } from 'class-validator';
import { NextFunction, Request, Response, Router } from 'express';
import { AppDataSource } from '../data-source';
import Community from '../entities/community.entity';
import User from '../entities/user.entity';
import multer, { FileFilterCallback } from 'multer';
import userMiddleware from '../middlewares/user';
import authMiddleware from '../middlewares/auth';
import Post from '../entities/post.entity';
import path from 'path';
import { unlinkSync } from 'fs';
import { makeId } from '../utils/helpers';

const createCommunity = async (req: Request, res: Response) => {
  const { name, title, description } = req.body;

  try {
    let errors: any = {};

    if (isEmpty(name)) {
      errors.name = '커뮤니티의 이름을 입력해주세요';
    }
    if (isEmpty(title)) {
      errors.title = '커뮤니티의 제목을 입력해주세요';
    }

    const community = await AppDataSource.getRepository(Community)
      .createQueryBuilder('community')
      .where('lower(community.name) = :name', { name: name.toLowerCase() })
      .getOne();

    if (community) {
      errors.name = '이미 존재하는 커뮤니티 이름입니다.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json(errors);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }

  try {
    const user: User = res.locals.user;

    const community = new Community();

    community.name = name;
    community.description = description;
    community.title = title;
    community.user = user;

    await community.save();

    return res.json(community);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error });
  }
};

// post의 갯수를 기준으로 5개의 커뮤니티 랭킹 조회
const communityRanking = async (_: Request, res: Response) => {
  try {
    const imageUrlExp = `COALESCE('${process.env.APP_URL}/images/' ||s."imageUrl",'https://www.gravatar.com/avatar?d=mp&f=y')`;
    const communities = await AppDataSource.createQueryBuilder()
      .select(
        `s.title, s.name, ${imageUrlExp} as "imageUrn", count(p.id) as "postCount"`,
      )
      .from(Community, 's')
      .leftJoin(Post, 'p', `s.name = p."communityName"`)
      .groupBy('s.title, s.name, "imageUrn"')
      .orderBy(`"postCount"`, 'DESC')
      .limit(5)
      .execute();
    return res.json(communities);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: '문제가 발생했습니다.' });
  }
};

const getCommunity = async (req: Request, res: Response) => {
  const { name } = req.params;

  try {
    const community = await Community.findOne({ where: { name } });

    if (!community) {
      res.status(404).json({ error: '커뮤니티를 찾을 수 없습니다.' });
    }

    const posts = await Post.find({
      where: { communityName: community.name },
      order: { createdAt: 'DESC' },
      relations: ['comments', 'votes'],
    });

    community.posts = posts;
    if (res.locals.user) {
      community.posts.forEach((p) => p.setUserVote(res.locals.user));
    }

    return res.json(community);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: '문제가 발생했습니다.' });
  }
};

const ownCommunity = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user: User = res.locals.user;
  try {
    const community = await Community.findOneOrFail({
      where: { name: req.params.name },
    });

    if (community.username !== user.username) {
      return res
        .status(403)
        .json({ error: '이 커뮤니티를 소유한 계정이 아닙니다.' });
    }

    res.locals.community = community;
    next();
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: ' 문제가 발생했습니다.' });
  }
};

const upload = multer({
  storage: multer.diskStorage({
    destination: 'public/images',
    filename: (_, file, callback) => {
      const name = makeId(10);
      callback(null, name + path.extname(file.originalname));
    },
  }),
  fileFilter: (_, file: any, callback: FileFilterCallback) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      callback(null, true);
    } else {
      callback(new Error('이미지가 아닙니다.'));
    }
  },
});

const uploadCommunityImage = async (req: Request, res: Response) => {
  const community: Community = res.locals.community;
  try {
    const type = req.body.type;
    // 파일 유형을 지정치 않았을 시에는 업로든 된 파일 삭제
    if (type !== 'image' && type !== 'banner') {
      if (!req.file?.path) {
        return res.status(400).json({ error: '유효하지 않은 파일' });
      }

      // 파일을 지워주기
      unlinkSync(req.file.path);
      return res.status(400).json({ error: '잘못된 유형' });
    }

    let oldImageUrl: string = '';

    if (type === 'image') {
      // 사용중인 Urn 을 저장합니다. (이전 파일을 아래서 삭제하기 위해서)
      oldImageUrl = community.imageUrl || '';
      // 새로운 파일 이름을 Urn 으로 넣어줍니다.
      community.imageUrl = `${req.file?.filename}` || '';
    } else if (type === 'banner') {
      oldImageUrl = community.bannerUrl || '';
      community.bannerUrl = `${req.file?.filename}` || '';
    }
    await community.save();

    // 사용하지 않는 이미지 파일 삭제
    if (oldImageUrl !== '') {
      const fullFilename = path.resolve(
        process.cwd(),
        'public',
        'images',
        oldImageUrl,
      );
      unlinkSync(fullFilename);
    }

    return res.json(community);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: '문제가 발생했습니다.' });
  }
};

const router = Router();

router.post('/', userMiddleware, authMiddleware, createCommunity);
router.get('/community/ranking', communityRanking);
router.get('/:name', userMiddleware, getCommunity);
router.post(
  '/:name/upload',
  userMiddleware,
  authMiddleware,
  ownCommunity,
  upload.single('file'),
  uploadCommunityImage,
);

export default router;
