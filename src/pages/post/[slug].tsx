/* eslint-disable react/no-danger */
import Link from 'next/link';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { useMemo } from 'react';
import { useRouter } from 'next/router';

import Header from '../../components/Header';
import Comments from '../../components/Comments';

import { dateFormater, dateTimeFormater } from '../../utils/dateFormater';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

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

interface NavigationPost {
  uid: string;
  title: string;
}

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: Banner;
    author: string;
    content: Content[];
  };
}

interface PostProps {
  post: Post;
  prev_page?: NavigationPost;
  next_page?: NavigationPost;
  preview: boolean;
}

export default function Post({
  post,
  prev_page,
  next_page,
  preview,
}: PostProps): JSX.Element {
  const router = useRouter();

  const readTime = useMemo(() => {
    if (!post) {
      return '0 min';
    }

    const words = post.data.content.reduce((acc, current) => {
      const titleLength = current.heading.split(' ').length;

      const contentLength = RichText.asText(current.body).split(' ').length;

      return acc + titleLength + contentLength;
    }, 0);

    return `${Math.ceil(words / 200)} min`;
  }, [post]);

  const updatedAt = useMemo(() => {
    if (!post.first_publication_date) {
      return null;
    }

    return dateTimeFormater(post.first_publication_date);
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

              {post.last_publication_date !== post.first_publication_date &&
                updatedAt && <span>{updatedAt}</span>}
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

            <footer className={styles.footer}>
              <div>
                {prev_page && (
                  <div className={styles.navigationContent}>
                    <span>{prev_page.title}</span>
                    <Link href={`/post/${prev_page.uid}`}>
                      <a>Post anterior</a>
                    </Link>
                  </div>
                )}
              </div>

              <div>
                {next_page && (
                  <div className={styles.navigationContent}>
                    <span>{next_page.title}</span>
                    <Link href={`/post/${next_page.uid}`}>
                      <a>Próximo post</a>
                    </Link>
                  </div>
                )}
              </div>
            </footer>

            <Comments key="ut-comments" props={{}} type="" />

            {preview && (
              <aside>
                <Link href="/api/exit-preview">
                  <a className={commonStyles.preview}>Sair do modo Preview</a>
                </Link>
              </aside>
            )}
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

export const getStaticProps: GetStaticProps<PostProps> = async ({
  params,
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();

  const { slug } = params;

  const post = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const [nextPageResponse, prevPageResponse] = await Promise.all([
    prismic.query([Prismic.Predicates.at('document.type', 'posts')], {
      pageSize: 1,
      after: String(post.id),
      orderings: '[document.first_publication_date desc]',
      fetch: ['posts.title'],
    }),
    prismic.query([Prismic.Predicates.at('document.type', 'posts')], {
      pageSize: 1,
      after: String(post.id),
      orderings: '[document.first_publication_date]',
      fetch: ['posts.title'],
    }),
  ]);

  if (!post) {
    return {
      notFound: true,
      props: { post: null },
    };
  }

  const [prevPage] = prevPageResponse?.results;
  const [nextPage] = nextPageResponse?.results;

  return {
    props: {
      post,
      prev_page: !prevPage
        ? null
        : {
            uid: prevPage?.uid,
            title: prevPage?.data?.title,
          },
      next_page: !nextPage
        ? null
        : {
            uid: nextPage?.uid,
            title: nextPage?.data?.title,
          },
      preview,
    },
  };
};
