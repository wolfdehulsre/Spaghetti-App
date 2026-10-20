begin;
select plan(6);
-- Use the deployed constraint and trigger on a temporary table; no member data.
create temporary table comment_probe(comment text);
do $$ declare definition text; begin
  select pg_get_constraintdef(oid) into definition from pg_constraint
    where conrelid='public.ratings'::regclass and conname='ratings_comment_length';
  execute 'alter table comment_probe add constraint probe_length ' || definition;
end $$;
create trigger probe_normalize before insert or update on comment_probe
for each row execute function private.normalize_rating_comment();
select lives_ok($$insert into comment_probe values(repeat('😀',500))$$,'500 emoji code points are accepted');
select throws_ok($$insert into comment_probe values(repeat('😀',501))$$,'23514',null,'501 emoji code points are rejected');
insert into comment_probe values(E' \t\n '), (E'  hello\r\nworld  ');
select is((select count(*)::int from comment_probe where comment is null),1,'whitespace becomes NULL');
select ok(exists(select 1 from comment_probe where comment=E'hello\nworld'),'trim preserves normalized internal newlines');
update comment_probe set comment=E' \tchanged 🍝 ' where comment is null;
select ok(exists(select 1 from comment_probe where comment='changed 🍝'),'edits are normalized too');
select ok((select relrowsecurity from pg_class where oid='public.ratings'::regclass),'ratings retain RLS');
select * from finish();
rollback;
