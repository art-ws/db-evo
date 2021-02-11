-- https://sqitch.org/docs/manual/sqitchtutorial/
-- https://postgrespro.ru/docs/postgresql/9.6/plpgsql-errors-and-messages#plpgsql-statements-assert

select * from public.t_03 limit 1;

DO $$
DECLARE
  result varchar;
BEGIN  
  result := (select 'X');
  ASSERT result = 'X';
END $$;