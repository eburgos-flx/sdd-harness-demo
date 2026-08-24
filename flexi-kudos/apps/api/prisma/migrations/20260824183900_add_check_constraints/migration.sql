ALTER TABLE "kudos"
  ADD CONSTRAINT "kudos_category_check"
  CHECK (category IN ('teamwork','ownership','innovation','delivery','kindness','learning'));

ALTER TABLE "kudos"
  ADD CONSTRAINT "kudos_no_self_kudo_check"
  CHECK (giver_id <> receiver_id);

ALTER TABLE "kudos"
  ADD CONSTRAINT "kudos_message_length_check"
  CHECK (char_length(message) BETWEEN 1 AND 1120);
