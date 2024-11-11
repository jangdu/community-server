import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import Comment from './comment.entity';
import Post from './post.entity';
import User from './user.entity';
import DefaultEntity from './default/default.entity';

@Entity('votes')
export default class Vote extends DefaultEntity {
  @Column()
  value: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'username', referencedColumnName: 'username' })
  user: User;

  @Column()
  username: string;

  @Column({ nullable: true })
  postId: number;

  @ManyToOne(() => Post)
  post: Post;

  @Column({ nullable: true })
  commentId: number;

  @ManyToOne(() => Comment)
  comment: Comment;
}
