alter table public.ratings
  add column comment text,
  add constraint ratings_comment_length check (char_length(comment) <= 500);

-- Match JavaScript trim() whitespace; preserve newlines inside the comment.
create function private.normalize_rating_comment()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.comment := nullif(btrim(
    replace(replace(new.comment, E'\r\n', E'\n'), E'\r', E'\n'),
    U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF'
  ), '');
  return new;
end;
$$;
revoke all on function private.normalize_rating_comment() from public, anon, authenticated;
create trigger ratings_normalize_comment
before insert or update on public.ratings
for each row execute function private.normalize_rating_comment();
comment on column public.ratings.comment is 'Optional comment, at most 500 Unicode code points. Stored in the author''s language.';

