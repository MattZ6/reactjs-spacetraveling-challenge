/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import { useMemo } from 'react';
import { useRouter } from 'next/router';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { dateFormater } from '../../utils/dateFormater';

interface Banner {
  url: string;
}

interface Body {
  text: string;
}

interface Content {
  heading: string;
  body: Body;
}

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: Banner;
    author: string;
    content: Content[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  const readTime = useMemo(() => {
    if (!post) {
      return '0 min';
    }

    const words = post.data.content.reduce((acc, current) => {
      acc += current.heading.split(' ').length;

      acc += RichText.asText(current.body).split(' ').length;

      return acc;
    }, 0);

    return `${Math.ceil(words / 200)} min`;
  }, [post]);

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Head>
        <title>{post?.data?.title ?? 'Carregando...'} — spacetravelling </title>
      </Head>

      <Header />

      {post ? (
        <>
          <img
            className={styles.bannerImage}
            src={post.data.banner.url}
            alt={post.data.title}
            loading="lazy"
          />

          <main className={commonStyles.maxWidthContainer}>
            <header className={styles.postHeader}>
              <h1>{post.data.title}</h1>

              <div className={styles.postInfo}>
                <div>
                  <FiCalendar size={20} />
                  <span>{dateFormater(post.first_publication_date)}</span>
                </div>
                <div>
                  <FiUser size={20} />
                  <span>{post.data.author}</span>
                </div>
                <div>
                  <FiClock size={20} />
                  <span>{readTime}</span>
                </div>
              </div>
            </header>

            <section className={styles.postContent}>
              {post.data.content.map(content => (
                <div key={content.heading}>
                  <h2>{content.heading}</h2>

                  <div
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(content.body),
                    }}
                  />
                </div>
              ))}
            </section>
          </main>
        </>
      ) : (
        <span>Carregando...</span>
      )}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['post.slug'],
    }
  );

  return {
    fallback: true,
    paths: response.results.map(result => ({
      params: { slug: result.uid },
    })),
  };
};

export const getStaticProps: GetStaticProps<PostProps> = async ({ params }) => {
  const prismic = getPrismicClient();

  const { slug } = params;

  const response = await prismic.getByUID('posts', String(slug), {});

  if (!response) {
    return {
      notFound: true,
      props: { post: null },
    };
  }

  return {
    props: {
      post: response,
    },
  };
};
