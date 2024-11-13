import { Entity, Column, Index, OneToMany, BeforeInsert } from 'typeorm';
import DefaultEntity from './default/default.entity';
import { IsEmail, Length, MinLength } from 'class-validator';
import { Exclude } from 'class-transformer';
import Post from './post.entity';
import Vote from './vote.entity';

import bcrypt from 'bcryptjs';

@Entity('users')
export default class User extends DefaultEntity {
  @Index()
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @Column({ unique: true })
  email: string;

  @Index()
  @Length(2, 20, { message: '사용자명은 3-20자 사이여야 합니다.' })
  @Column({ unique: true })
  username: string;

  @Exclude()
  @Column()
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  password: string;

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @OneToMany(() => Vote, (vote) => vote.user)
  votes: Vote[];

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 6);
  }
}
